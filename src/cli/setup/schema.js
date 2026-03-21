/**
 * Configuration schema organized by module context.
 *
 * Each group maps to a conceptual area (core, layout, module, shared component).
 * Each section within a group maps to a YAML config file and describes its fields.
 *
 * Field types: 'string', 'number', 'boolean', 'array', 'object', 'select'
 * Special editor types: 'layout' (taxa_page drag-and-drop editor)
 */

export default {
  core: {
    label: 'Core',
    sections: {
      api: {
        file: 'api.yml',
        label: 'API Connection',
        description: 'TaxonWorks API server and authentication',
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
            placeholder: 'My Species File'
          },
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
              name: { type: 'string', label: 'Name' },
              content: { type: 'string', label: 'Content' }
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
            placeholder: 'Site name'
          },
          header_links: {
            type: 'array',
            label: 'Navigation Links',
            items: {
              label: { type: 'string', label: 'Label' },
              link: { type: 'string', label: 'URL' },
              submenu: {
                type: 'array',
                label: 'Submenu',
                optional: true,
                items: {
                  label: { type: 'string', label: 'Label' },
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
            placeholder: 'License description'
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
              }
            }
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
              label: { type: 'string', label: 'Label' },
              description: { type: 'string', label: 'Description' },
              url: { type: 'string', label: 'URL' }
            }
          }
        }
      }
    }
  },

  modules: {
    label: 'Modules',
    sections: {
      otus: {
        file: 'taxa_page.yml',
        label: 'Taxa Page Layout',
        description: 'Panel layout for taxon pages',
        editor: 'layout'
      },
      news: {
        file: 'news.yml',
        label: 'News',
        description: 'News module configuration',
        configKey: 'news_module',
        fields: {
          news_module: {
            type: 'object',
            label: 'News Module',
            fields: {
              index_page: {
                type: 'object',
                label: 'Index Page',
                fields: {
                  news_per_page: {
                    type: 'number',
                    label: 'Items Per Page',
                    default: 10
                  },
                  pinned_news_id: {
                    type: 'array',
                    label: 'Pinned News IDs',
                    items: { type: 'number' }
                  },
                  layout: {
                    type: 'select',
                    label: 'Layout',
                    options: ['list', 'cards'],
                    default: 'list'
                  },
                  show_date: {
                    type: 'boolean',
                    label: 'Show Date',
                    default: true
                  }
                }
              },
              news_page: {
                type: 'object',
                label: 'News Page',
                fields: {
                  show_date: {
                    type: 'boolean',
                    label: 'Show Date',
                    default: true
                  },
                  show_author: {
                    type: 'boolean',
                    label: 'Show Author',
                    default: true
                  }
                }
              },
              widget: {
                type: 'object',
                label: 'Widget',
                fields: {
                  news_count: {
                    type: 'number',
                    label: 'Items Count',
                    default: 3
                  },
                  show_date: {
                    type: 'boolean',
                    label: 'Show Date',
                    default: true
                  },
                  show_content: {
                    type: 'boolean',
                    label: 'Show Content Preview',
                    default: true
                  }
                }
              }
            }
          }
        }
      }
    }
  },

  packages: {
    label: 'Packages',
    sections: {
      installed: {
        label: 'Installed Packages',
        description: 'Manage installed TaxonPages modules and panels',
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
        description: 'Map tile server configuration',
        fields: {
          map_tiles: {
            type: 'array',
            label: 'Tile Providers',
            items: {
              label: { type: 'string', label: 'Label' },
              attribution: { type: 'string', label: 'Attribution' },
              server: { type: 'string', label: 'Tile Server URL' },
              tileSize: {
                type: 'number',
                label: 'Tile Size',
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
              }
            }
          }
        }
      }
    }
  }
}
