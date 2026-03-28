import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Search')
@ApiBearerAuth()
@Controller('search')
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Búsqueda global' })
  search(@CurrentUser('tenantId') tenantId: string, @Query('q') q: string) {
    return this.searchService.search(tenantId, q || '');
  }
}
