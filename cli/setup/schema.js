/**
 * Configuration schema organized by module context.
 *
 * Each group maps to a conceptual area (core, layout, module, shared component).
 * Each section within a group maps to a YAML config file and describes its fields.
 *
 * Field types: 'string', 'number', 'boolean', 'array', 'object', 'select'
 * Modules can provide custom editors via setup.schema.json with editor: 'custom'
 *
 * A string field marked `translatable: true` holds text the reader sees, and
 * so may carry one value per configured locale. The set marked here is the one
 * core resolves through `localize`/`localizeDeep` at runtime — marking a field
 * core does not localize would offer a translation that never renders.
 * Anything that is identity rather than text (a URL, a meta tag's `name`, a
 * citation) is deliberately left unmarked.
 */

import { TILE_PRESETS } from './constants/tilePresets.js'

export default {
  status: {
    label: 'Status',
    sections: {
      overview: {
        label: 'Overview',
        description: 'Version, environment, and package information',
        editor: 'status'
      }
    }
  },

  core: {
    label: 'Core',
    sections: {
      api: {
        file: 'api.yml',
        label: 'API Connection',
        description: 'TaxonWorks API server and authentication',
        editor: 'api-connection',
        fields: {
          url: {
            type: 'string',
            label: 'API URL',
            required: true,
            placeholder: 'https://your.taxonworks.server/api/v1'
          },
          project_token: {
            type: 'string',
            label: 'Project Token',
            required: true,
            placeholder: 'Your project token'
          }
        }
      },
      project: {
        file: 'project.yml',
        label: 'Project Identity',
        description: 'Project name, citation, and authorship',
        fields: {
          project_name: {
            type: 'string',
            label: 'Project Name',
            translatable: true,
            placeholder: 'My Species File'
          },
          // Not translatable: a citation is how the site is referred to in the
          // literature, and stays in one form.
          project_citation: {
            type: 'string',
            label: 'Citation',
            placeholder: 'Project citation text'
          },
          project_url: {
            type: 'string',
            label: 'Project URL',
            placeholder: 'https://your-project.org'
          },
          project_authors: {
            type: 'string',
            label: 'Authors',
            placeholder: 'Author names'
          }
        }
      },
      i18n: {
        file: 'i18n.yml',
        label: 'Languages',
        description:
          'Languages the site is built for, and how they appear in URLs',
        editor: 'i18n'
      },
      // A `translations` section is injected here by the server, but only for
      // a site with more than one locale — see withTranslationsSection.
      router: {
        file: 'router.yml',
        label: 'Router',
        description: 'URL routing configuration',
        fields: {
          base_url: {
            type: 'string',
            label: 'Base URL',
            placeholder: '/',
            default: '/'
          },
          hash_mode: {
            type: 'boolean',
            label: 'Hash Mode',
            description: 'Use hash-based routing instead of history mode',
            default: false
          }
        }
      },
      metadata: {
        file: 'metadata.yml',
        label: 'SEO / Metadata',
        description: 'HTML meta tags for search engines',
        fields: {
          metadata: {
            type: 'array',
            label: 'Meta Tags',
            items: {
              // `name` is the meta tag's name — part of the HTML contract,
              // never text.
              name: { type: 'string', label: 'Name' },
              content: { type: 'string', label: 'Content', translatable: true }
            }
          }
        }
      },
      analytics: {
        file: 'analytics.yml',
        label: 'Analytics',
        description: 'Analytics and tracking services',
        fields: {
          analytics_services: {
            type: 'object',
            label: 'Analytics Services',
            fields: {
              enableDev: {
                type: 'boolean',
                label: 'Enable in Development',
                default: false
              },
              analytics: {
                type: 'array',
                label: 'Google Analytics',
                optional: true,
                items: {
                  id: { type: 'string', label: 'Measurement ID' }
                }
              },
              gtm: {
                type: 'array',
                label: 'Google Tag Manager',
                optional: true,
                items: {
                  id: { type: 'string', label: 'Container ID' }
                }
              },
              pixel: {
                type: 'array',
                label: 'Facebook Pixel',
                optional: true,
                items: {
                  id: { type: 'string', label: 'Pixel ID' }
                }
              },
              retargeting: {
                type: 'array',
                label: 'VK Retargeting',
                optional: true,
                items: {
                  id: { type: 'string', label: 'Retargeting ID' }
                }
              },
              linkedin: {
                type: 'array',
                label: 'LinkedIn Insight',
                optional: true,
                items: {
                  id: { type: 'string', label: 'Partner ID' }
                }
              },
              tongji: {
                type: 'array',
                label: 'Baidu Tongji',
                optional: true,
                items: {
                  id: { type: 'string', label: 'Token' }
                }
              },
              metrica: {
                type: 'array',
                label: 'Yandex Metrica',
                optional: true,
                items: {
                  id: { type: 'string', label: 'Counter ID' }
                }
              },
              microsoft: {
                type: 'array',
                label: 'Microsoft Clarity / UET',
                optional: true,
                items: {
                  id: { type: 'string', label: 'Tag ID' }
                }
              },
              hotjar: {
                type: 'array',
                label: 'Hotjar',
                optional: true,
                items: {
                  id: { type: 'string', label: 'Site ID' }
                }
              },
              fullStory: {
                type: 'array',
                label: 'FullStory',
                optional: true,
                items: {
                  id: { type: 'string', label: 'Org ID' }
                }
              },
              tiktok: {
                type: 'array',
                label: 'TikTok Pixel',
                optional: true,
                items: {
                  id: { type: 'string', label: 'Pixel ID' }
                }
              }
            }
          }
        }
      }
    }
  },

  layout: {
    label: 'Layout',
    sections: {
      header: {
        file: 'header.yml',
        label: 'Header & Navigation',
        description: 'Logo and navigation menu',
        fields: {
          header_logo_url: {
            type: 'string',
            label: 'Logo URL',
            placeholder: 'https://example.com/logo.png'
          },
          header_logo_text: {
            type: 'string',
            label: 'Logo Text',
            translatable: true,
            placeholder: 'Site name'
          },
          header_links: {
            type: 'array',
            label: 'Navigation Links',
            sortable: true,
            items: {
              label: { type: 'string', label: 'Label', translatable: true },
              link: { type: 'string', label: 'URL' },
              submenu: {
                type: 'array',
                label: 'Submenu',
                optional: true,
                items: {
                  label: { type: 'string', label: 'Label', translatable: true },
                  link: { type: 'string', label: 'URL' }
                }
              }
            }
          }
        }
      },
      copyright: {
        file: 'copyright.yml',
        label: 'Footer & Copyright',
        description: 'Copyright and license information',
        fields: {
          copyright_image: {
            type: 'string',
            label: 'License Badge URL',
            placeholder: 'https://licensebuttons.net/l/by/4.0/80x15.png'
          },
          copyright_image_link: {
            type: 'string',
            label: 'License Link',
            placeholder: 'https://creativecommons.org/licenses/by/4.0/'
          },
          copyright_text: {
            type: 'string',
            label: 'Copyright Text',
            translatable: true,
            placeholder: 'License description'
          }
        }
      },
      trackers: {
        file: 'tracker.yml',
        label: 'Issue Trackers',
        description: 'Links for reporting issues',
        fields: {
          issue_trackers: {
            type: 'array',
            label: 'Trackers',
            items: {
              label: { type: 'string', label: 'Label', translatable: true },
              description: {
                type: 'string',
                label: 'Description',
                translatable: true
              },
              url: { type: 'string', label: 'URL' }
            }
          }
        }
      }
    }
  },

  style: {
    label: 'Style',
    sections: {
      theme: {
        label: 'Theme Colors',
        description: 'Color palette for light and dark modes',
        editor: 'style'
      }
    }
  },

  modules: {
    label: 'Modules',
    sections: {}
  },

  packages: {
    label: 'Packages',
    sections: {
      installed: {
        label: 'Package Manager',
        description: 'Install, update, and manage TaxonPages modules and panels',
        editor: 'packages'
      }
    }
  },

  shared: {
    label: 'Shared Components',
    sections: {
      maps: {
        file: 'maps.yml',
        label: 'Map Tile Providers',
        description:
          'Tile servers used by the map. The first provider is the default; add more to expose a layer switcher. URL placeholders: {s} subdomain, {z}/{x}/{y} tile coords, {r} retina suffix.',
        fields: {
          map_tiles: {
            type: 'array',
            label: 'Tile Providers',
            sortable: true,
            presets: TILE_PRESETS,
            items: {
              label: {
                type: 'string',
                label: 'Label',
                placeholder: 'OpenStreetMap'
              },
              attribution: {
                type: 'string',
                label: 'Attribution',
                placeholder: '&copy; OpenStreetMap contributors'
              },
              server: {
                type: 'string',
                label: 'Tile Server URL',
                placeholder: 'https://{s}.tile.example.org/{z}/{x}/{y}.png'
              },
              subdomains: {
                type: 'string',
                label: 'Subdomains',
                description: 'Characters used to replace {s} in the URL (e.g. "abc").',
                optional: true
              },
              tileSize: {
                type: 'number',
                label: 'Tile Size',
                description: 'Pixel size of a tile. Common values: 256, 512.',
                optional: true
              },
              zoomOffset: {
                type: 'number',
                label: 'Zoom Offset',
                description: 'Offset applied to zoom values when requesting tiles.',
                optional: true
              },
              minZoom: {
                type: 'number',
                label: 'Min Zoom',
                optional: true
              },
              maxZoom: {
                type: 'number',
                label: 'Max Zoom',
                optional: true
              },
              maxNativeZoom: {
                type: 'number',
                label: 'Max Native Zoom',
                description: 'Highest zoom level the server provides; deeper zooms are upscaled.',
                optional: true
              },
              opacity: {
                type: 'number',
                label: 'Opacity',
                description: 'Layer opacity from 0 to 1.',
                optional: true
              },
              detectRetina: {
                type: 'boolean',
                label: 'Detect Retina',
                description: 'Request higher-resolution tiles on high-DPI screens.',
                optional: true
              },
              noWrap: {
                type: 'boolean',
                label: 'No Wrap',
                description: 'Disable horizontal world wrapping.',
                optional: true
              }
            }
          }
        }
      }
    }
  }
}
