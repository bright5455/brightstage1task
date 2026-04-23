import { AppDataSource } from '../data-source';
import { Profile } from '../profiles/entity/profile.entity';
import { uuidv7 } from 'uuidv7';
import * as seedData from './profiles.json';

async function seed() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(Profile);
 await AppDataSource.synchronize(true);
  console.log(`Seeding ${seedData.profiles.length} profiles...`);

  let inserted = 0;
  let skipped = 0;

  for (const p of seedData.profiles) {
    const existing = await repo.findOne({
      where: { name: p.name.toLowerCase() },
    });

    if (existing) {
      skipped++;
      continue;
    }

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

  console.log(`Done. Inserted: ${inserted}, Skipped: ${skipped}`);
  await AppDataSource.destroy();
}

seed().catch(console.error);