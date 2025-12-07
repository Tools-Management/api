// scripts/create-superadmin.prod.ts
import 'dotenv/config'
import sequelize from '../src/config/database';
import { UserValidationUtils } from '../src/utils/userValidation';
import { USER_ROLES } from '../src/constants'
import { Logger, ENV } from '../src/lib'

async function createSuperAdmin() {
  try {
    Logger.info('Creating Super Admin (auto)...')

    await sequelize.authenticate()
    Logger.info('DB connected')

    const username = ENV.SUPER_ADMIN_USERNAME || 'admin'
    const email = ENV.SUPER_ADMIN_EMAIL || 'tuandtdeveloper@gmail.com'
    const password = ENV.SUPER_ADMIN_PASSWORD || 'Admin@123'
    const result = await UserValidationUtils.createUser({
      username,
      email,
      password,
      role: USER_ROLES.ROLE_SUPER_ADMIN,
    })
    if (!result.success) {
      if (result.error?.includes('already exists')) {
        Logger.info('Super Admin already exists')
        return
      }
      throw new Error(result.error)
    }

    Logger.info('Super Admin created successfully!')
    Logger.info(`   Email: ${email}`)
    Logger.info(`   Password: ${password}`)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    Logger.error(`Error: ${error.message}`)
  } finally {
    await sequelize.close()
  }
}

createSuperAdmin()