import { Injectable, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { uuidv7 } from 'uuidv7';
import { Profile } from 'src/profiles/entity/profile.entity';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepo: Repository<Profile>,
    private readonly httpService: HttpService,
  ) {}

  private getAgeGroup(age: number): string {
    if (age <= 12) return 'child';
    if (age <= 19) return 'teenager';
    if (age <= 59) return 'adult';
    return 'senior';
  }

  async create(name: string) {
    const normalized = name.trim().toLowerCase();

    // Check if profile already exists
    const existing = await this.profileRepo.findOne({
      where: { name: normalized },
    });

    if (existing) {
      return {
        status: 'success',
        message: 'Profile already exists',
        data: existing,
      };
    }

    // Call all three APIs in parallel
    let genderData: any, agifyData: any, nationalizeData: any;

    try {
      const [genderRes, agifyRes, nationalizeRes] = await Promise.all([
        firstValueFrom(
          this.httpService.get('https://api.genderize.io', { params: { name: normalized } }),
        ),
        firstValueFrom(
          this.httpService.get('https://api.agify.io', { params: { name: normalized } }),
        ),
        firstValueFrom(
          this.httpService.get('https://api.nationalize.io', { params: { name: normalized } }),
        ),
      ]);

      genderData = genderRes.data;
      agifyData = agifyRes.data;
      nationalizeData = nationalizeRes.data;
    } catch {
      throw new HttpException(
        { status: 'error', message: 'Upstream or server failure' },
        HttpStatus.BAD_GATEWAY,
      );
    }

    // Validate each API response
    if (genderData.gender === null || genderData.count === 0) {
      throw new HttpException(
        { status: 'error', message: 'Genderize returned an invalid response' },
        HttpStatus.BAD_GATEWAY,
      );
    }

    if (agifyData.age === null) {
      throw new HttpException(
        { status: 'error', message: 'Agify returned an invalid response' },
        HttpStatus.BAD_GATEWAY,
      );
    }

    if (!nationalizeData.country || nationalizeData.country.length === 0) {
      throw new HttpException(
        { status: 'error', message: 'Nationalize returned an invalid response' },
        HttpStatus.BAD_GATEWAY,
      );
    }

    // Pick country with highest probability
    const topCountry = nationalizeData.country.reduce(
      (best: any, current: any) =>
        current.probability > best.probability ? current : best,
      nationalizeData.country[0],
    );

    const profile = this.profileRepo.create({
      id: uuidv7(),
      name: normalized,
      gender: genderData.gender,
      gender_probability: genderData.probability,
      sample_size: genderData.count,
      age: agifyData.age,
      age_group: this.getAgeGroup(agifyData.age),
      country_id: topCountry.country_id,
      country_probability: topCountry.probability,
    });

    const saved = await this.profileRepo.save(profile);

    return {
      status: 'success',
      data: saved,
    };
  }

  async findAll(query: { gender?: string; country_id?: string; age_group?: string }) {
    const qb = this.profileRepo.createQueryBuilder('profile');

    if (query.gender) {
      qb.andWhere('LOWER(profile.gender) = LOWER(:gender)', { gender: query.gender });
    }
    if (query.country_id) {
      qb.andWhere('LOWER(profile.country_id) = LOWER(:country_id)', { country_id: query.country_id });
    }
    if (query.age_group) {
      qb.andWhere('LOWER(profile.age_group) = LOWER(:age_group)', { age_group: query.age_group });
    }

    const profiles = await qb.getMany();

    return {
      status: 'success',
      count: profiles.length,
      data: profiles.map((p) => ({
        id: p.id,
        name: p.name,
        gender: p.gender,
        age: p.age,
        age_group: p.age_group,
        country_id: p.country_id,
      })),
    };
  }

  async findOne(id: string) {
    const profile = await this.profileRepo.findOne({ where: { id } });

    if (!profile) {
      throw new NotFoundException({
        status: 'error',
        message: 'Profile not found',
      });
    }

    return { status: 'success', data: profile };
  }

  async remove(id: string) {
    const profile = await this.profileRepo.findOne({ where: { id } });

    if (!profile) {
      throw new NotFoundException({
        status: 'error',
        message: 'Profile not found',
      });
    }

    await this.profileRepo.delete(id);
  }
}