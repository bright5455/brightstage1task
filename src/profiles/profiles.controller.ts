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
import { CreateProfileDto } from './dto/create-profile.dto';

@Controller('api/profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createProfileDto: CreateProfileDto) {
    const { name } = createProfileDto;

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

  @Get()
  async findAll(
    @Query('gender') gender?: string,
    @Query('country_id') country_id?: string,
    @Query('age_group') age_group?: string,
  ) {
    return this.profilesService.findAll({ gender, country_id, age_group });
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