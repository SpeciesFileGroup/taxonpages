import { I18N_DEFAULTS } from '../i18n/config.js'

export default {
  base_url: '/',
  hash_mode: false,
  // Guarantees __APP_ENV__.i18n is always defined. Because config files are
  // merged with a shallow Object.assign, a user-provided i18n block replaces
  // this one wholesale — resolveI18nConfig() re-applies defaults at read time.
  i18n: { ...I18N_DEFAULTS },
  map_tile_server: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  map_tile_attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}
