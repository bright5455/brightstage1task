import { AppDataSource } from '../data-source';
import { Profile } from '../profiles/entity/profile.entity';
import { uuidv7 } from 'uuidv7';
import * as seedData from './profiles.json';

async function seed() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(Profile);

  await repo.query('DELETE FROM profiles');
  let inserted = 0;

  for (const p of seedData.profiles) {
    await repo.save(
      repo.create({
        id: uuidv7(),
        name: p.name.toLowerCase(),
        gender: p.gender,
        gender_probability: p.gender_probability,
        age: p.age,
        age_group: p.age_group,
        country_id: p.country_id,
        country_name: p.country_name,
        country_probability: p.country_probability,
      }),
    );
    inserted++;
  }

  console.log(`Done. Inserted: ${inserted}`);
  await AppDataSource.destroy();
}

seed().catch(console.error);