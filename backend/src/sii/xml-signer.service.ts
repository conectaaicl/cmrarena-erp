import { Injectable, BadRequestException } from '@nestjs/common';
import * as forge from 'node-forge';
import * as crypto from 'crypto';

@Injectable()
export class XmlSignerService {
  /**
   * Firma el XML del DTE con el certificado PFX del contribuyente
   * Implementa xmldsig según esquema SII
   */
  async signXml(xmlContent: string, pfxBuffer: Buffer, pfxPassword: string): Promise<string> {
    try {
      // Load PFX
      const pfx = forge.pkcs12.pkcs12FromAsn1(
        forge.asn1.fromDer(forge.util.createBuffer(pfxBuffer.toString('binary'))),
        pfxPassword,
      );

      // Extract private key and certificate
      const bags = pfx.getBags({ bagType: forge.pki.oids.certBag });
      const certBag = bags[forge.pki.oids.certBag][0];
      const cert = certBag.cert;

      const keyBags = pfx.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
      const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag][0];
      const privateKey = keyBag.key;

      // Get certificate in PEM
      const certPem = forge.pki.certificateToPem(cert);
      const certBase64 = certPem
        .replace('-----BEGIN CERTIFICATE-----', '')
        .replace('-----END CERTIFICATE-----', '')
        .replace(/\n/g, '');

      // Canonicalize the document for signing
      const canonicalized = this.canonicalize(xmlContent);
      const digestB64 = this.sha1Base64(canonicalized);

      // Build SignedInfo
      const signedInfo = this.buildSignedInfo(digestB64);
      const signedInfoCanon = this.canonicalize(signedInfo);

      // Sign with RSA-SHA1
      const md = forge.md.sha1.create();
      md.update(signedInfoCanon, 'utf8');
      const signature = forge.util.encode64(privateKey.sign(md));

      // Build complete signature block
      const signatureXml = `
<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
  <SignedInfo>
    <CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
    <SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/>
    <Reference URI="#DTE">
      <DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>
      <DigestValue>${digestB64}</DigestValue>
    </Reference>
  </SignedInfo>
  <SignatureValue>${signature}</SignatureValue>
  <KeyInfo>
    <X509Data>
      <X509Certificate>${certBase64}</X509Certificate>
    </X509Data>
  </KeyInfo>
</Signature>`;

      // Inject signature before closing DTE tag
      return xmlContent.replace('</DTE>', signatureXml + '</DTE>');
    } catch (err) {
      throw new BadRequestException(`Error firmando DTE: ${err.message}`);
    }
  }

  getCertInfo(pfxBuffer: Buffer, pfxPassword: string): { subject: string; expiresAt: Date } {
    const pfx = forge.pkcs12.pkcs12FromAsn1(
      forge.asn1.fromDer(forge.util.createBuffer(pfxBuffer.toString('binary'))),
      pfxPassword,
    );
    const bags = pfx.getBags({ bagType: forge.pki.oids.certBag });
    const cert = bags[forge.pki.oids.certBag][0].cert;
    return {
      subject: cert.subject.getField('CN')?.value || 'Desconocido',
      expiresAt: cert.validity.notAfter,
    };
  }

  private canonicalize(xml: string): string {
    // Basic C14N - strip XML declaration, normalize whitespace
    return xml.replace(/<\?xml[^>]*\?>/g, '').trim();
  }

  private sha1Base64(input: string): string {
    return crypto.createHash('sha1').update(input, 'utf8').digest('base64');
  }

  private buildSignedInfo(digestB64: string): string {
    return `<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#">
  <CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
  <SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/>
  <Reference URI="#DTE">
    <DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>
    <DigestValue>${digestB64}</DigestValue>
  </Reference>
</SignedInfo>`;
  }
}
