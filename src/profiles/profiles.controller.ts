import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ProfilesService } from './profiles.service';

@Controller('api/profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: any) {
    const { name } = body;

    if (name === undefined || name === null || name === '') {
      throw new HttpException(
        { status: 'error', message: 'Missing or empty name' },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (typeof name !== 'string') {
      throw new HttpException(
        { status: 'error', message: 'name must be a string' },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    return this.profilesService.create(name);
  }

  @Get('search')
  async search(
    @Query('q') q: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    if (!q || q.trim() === '') {
      throw new HttpException(
        { status: 'error', message: 'Missing or empty query' },
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.profilesService.search(q, page, limit);
  }

  @Get()
  async findAll(@Query() query: any) {
    return this.profilesService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.profilesService.findOne(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    return this.profilesService.remove(id);
  }
}