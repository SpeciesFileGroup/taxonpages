import { ref } from 'vue'

/**
 * Which section the wizard is showing.
 *
 * Module-level so a component can send the reader somewhere else without the
 * state having to be threaded down from App.vue — the translations overview
 * lists values that live in other sections and links to them.
 */
const activeSection = ref('')

export function useNavigation() {
  /**
   * @param {string} sectionPath - `group.section`
   */
  function goToSection(sectionPath) {
    activeSection.value = sectionPath
  }

  return { activeSection, goToSection }
}
