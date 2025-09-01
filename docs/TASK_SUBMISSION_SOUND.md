# Task Submission Sound Feature

## Overview
This feature adds a satisfying dopamine-releasing sound effect when submitting tasks on U-Cursos, specifically on pages with the URL pattern `https://www.u-cursos.cl/*/*/*/*/*/tareas/detalle*`.

## Implementation Details

### Files Modified/Created:
1. **`js/taskSubmissionSound.js`** - Main feature implementation
2. **`manifest.json`** - Added content script configuration
3. **`js/menuGen.js`** - Added feature to settings menu and default configuration
4. **`js/achievementsGen.js`** - Added achievements for this feature

### Target Element
The feature targets submit buttons with the following characteristics:
- Selector: `#body > form > input[type=submit]:nth-child(4)`
- Fallback: Any `input[type="submit"]` with `value="Entregar"`

### Sound Implementation
The feature uses a fallback-first approach:
1. **Primary**: Web Audio API creating a pleasant C major chord progression
2. **Fallback**: Loads Howler.js for enhanced audio capabilities (if needed)

### Features Include:
- ✅ Pleasant multi-tone chime sound (C major chord: C4-E4-G4-C5)
- ✅ Visual feedback on button click (scale animation + green glow)
- ✅ Hover effects for better UX
- ✅ Achievement tracking for first use
- ✅ Settings integration (can be enabled/disabled)
- ✅ Automatic detection of task submission pages
- ✅ Dynamic button detection (handles dynamically loaded content)

### Achievements
1. **Feature Achievement**: "Sonido de Entrega de Tareas" - Epic rarity
2. **Interaction Achievement**: "Primer Sonido de Entrega" - Legendary rarity

### Settings
- Feature ID: `taskSubmissionSound`
- Default: Enabled (`true`)
- Description: "Sonido de dopamina al entregar tareas"
- Icon: 🔊

## Usage
When users visit a U-Cursos task submission page and the feature is enabled:
1. The script automatically detects submit buttons
2. Adds sound and visual effects to the "Entregar" button
3. Plays a satisfying sound when clicked
4. Tracks achievement on first use
5. Provides visual feedback (scale + glow effects)

## Technical Notes
- Uses Web Audio API for reliable cross-browser compatibility
- Graceful fallback if audio context is not available
- Non-blocking implementation (doesn't interfere with form submission)
- Memory efficient (only loads on relevant pages)
- Compatible with existing U-Cursos extension architecture

## URL Pattern
The feature activates on URLs matching:
```
*://www.u-cursos.cl/*/*/*/*/*/tareas/detalle*
```

This ensures it only runs on task submission detail pages.
