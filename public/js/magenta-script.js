"use strict";

/*************************
 * Consts for everyone!
 ************************/
// button mappings.
const MAPPING_8 = {0:0, 1:1, 2:2, 3:3, 4:4, 5:5, 6:6, 7:7};
const MAPPING_4 = {0:0, 1:2, 2:5, 3:7};
const BUTTONS_DEVICE = ['a','s','d','f','j','k','l',';'];
const BUTTONS_MAKEY = ['ArrowUp','ArrowLeft','ArrowDown','ArrowRight','w','a','s','d'];
const BUTTONS_MAKEY_DISPLAY = ['↑','←','↓','→','w','a','s','d'];

let OCTAVES = 7;
let NUM_BUTTONS = 8;
let BUTTON_MAPPING = MAPPING_8;

let keyWhitelist;
let TEMPERATURE = getTemperature();

const heldButtonToVisualData = new Map();

// Which notes the pedal is sustaining.
let sustaining = false
let sustainingNotes = [];

// Mousedown/up events are weird because you can mouse down in one element and mouse up
// in another, so you're going to lose that original element and never mouse it up.
let mouseDownButton = null;

const mplayer = new Player();
const genie = new mm.PianoGenie(CONSTANTS.GENIE_CHECKPOINT);
let isUsingMakey = false;

/*************************
 * Basic UI bits
 ************************/
function initEverything() {
    BUTTON_MAPPING = MAPPING_8;

    OCTAVES = 7;
    const bonusNotes = 4;  // starts on an A, ends on a C.
    const totalNotes = CONSTANTS.NOTES_PER_OCTAVE * OCTAVES + bonusNotes; 
    const totalWhiteNotes = CONSTANTS.WHITE_NOTES_PER_OCTAVE * OCTAVES + (bonusNotes - 1); 
    keyWhitelist = Array(totalNotes).fill().map((x,i) => {
        if (OCTAVES > 6) return i;
        // Starting 3 semitones up on small screens (on a C), and a whole octave up.
        return i + 3 + CONSTANTS.NOTES_PER_OCTAVE;
    });
  
    genie.initialize().then(() => {
        console.log('🧞‍♀️ ready!');
        showMainScreen();
    });
}

function showMainScreen() {
    mplayer.usingMidiOut = true;

    mplayer.usingMidiIn = true;
  
    // Figure out if WebMidi works.
    if (navigator.requestMIDIAccess) {
        navigator.requestMIDIAccess().then((midi) => mplayer.midiReady(midi), (err) => console.log('Something went wrong', err));
    } else {
        console.log("Midi not supported.");
    }

    // Slow to start up, so do a fake prediction to warm up the model.
    const note = genie.nextFromKeyWhitelist(0, keyWhitelist, TEMPERATURE);
    genie.resetState();
}

/*
Trigger with
mButtonDown(event.target.dataset.id, true);
mButtonUp(event.target.dataset.id, true);
*/

/*************************
 * Button actions
 ************************/
function mButtonDown(button, fromKeyDown) {
  // If we're already holding this button down, nothing new to do.
  if (heldButtonToVisualData.has(button)) {
    return;
  }
    
  const note = genie.nextFromKeyWhitelist(BUTTON_MAPPING[button], keyWhitelist, TEMPERATURE);
  const pitch = CONSTANTS.LOWEST_PIANO_KEY_MIDI_NOTE + note;

  // Hear it.
  mplayer.playNoteDown(pitch, button);
  

}

function mButtonUp(button) {
  const thing = heldButtonToVisualData.get(button);
  if (thing) {   
    // Maybe stop hearing it.
    const pitch = CONSTANTS.LOWEST_PIANO_KEY_MIDI_NOTE + thing.note;
    if (!sustaining) {
      mplayer.playNoteUp(pitch, button);
    } else {
      sustainingNotes.push(CONSTANTS.LOWEST_PIANO_KEY_MIDI_NOTE + thing.note);
    }
  }
  heldButtonToVisualData.delete(button);
}

/*************************
 * Events
 ************************/
function mOnKeyDown(event) {
  //mplayer.tone.context.resume();
  console.log("key!");

  // Keydown fires continuously and we don't want that.
  if (event.repeat) {
    return;
  }
  if (event.key === ' ') {  // sustain pedal
    sustaining = true;
  } else if (event.key === '0' || event.key === 'r') {
    console.log('🧞‍♀️ resetting!');
    genie.resetState();
  } else {
    const button = getButtonFromKeyCode(event.key);
    if (button != null) {
      mButtonDown(button, true);
    }
  }
}

function mOnKeyUp(event) {
  if (event.key === ' ') {  // sustain pedal
    sustaining = false;
    
    // Release everything.
    sustainingNotes.forEach((note) => mplayer.playNoteUp(note, -1));
    sustainingNotes = [];
  } else {
    const button = getButtonFromKeyCode(event.key);
    if (button != null) {
      mButtonUp(button);
    }
  }
}


/*************************
 * Utils and helpers
 ************************/
function getButtonFromKeyCode(key) {
  // 1 - 8
  if (key >= '1' && key <= String(NUM_BUTTONS)) {
    return parseInt(key) - 1;
  } 
  
  const index = isUsingMakey ? BUTTONS_MAKEY.indexOf(key) : BUTTONS_DEVICE.indexOf(key);
  return index !== -1 ? index : null;
}

function getTemperature() {
  const hash = parseFloat(parseHashParameters()['temperature']) || 0.25;
  const newTemp = Math.min(1, hash);
  console.log('🧞‍♀️ temperature = ', newTemp);
  return newTemp;
}

function parseHashParameters() {
  const hash = window.location.hash.substring(1);
  const params = {}
  hash.split('&').map(hk => {
    let temp = hk.split('=');
    params[temp[0]] = temp[1]
  });
  return params;
}
