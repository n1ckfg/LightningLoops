"use strict";

const CONSTANTS = {
  COLORS : ['#EE2B29','#ff9800','#ffff00','#c6ff00','#00e5ff','#2979ff','#651fff','#d500f9'],
  NUM_BUTTONS : 8,
  NOTES_PER_OCTAVE : 12,
  WHITE_NOTES_PER_OCTAVE : 7,
  LOWEST_PIANO_KEY_MIDI_NOTE : 21,
  //GENIE_CHECKPOINT : 'https://storage.googleapis.com/magentadata/js/checkpoints/piano_genie/model/epiano/stp_iq_auto_contour_dt_166006',  
  GENIE_CHECKPOINT : './js/libraries/magenta/models/piano_genie/v002',  
}

/*************************
 * MIDI or Magenta player
 ************************/
class Player {
  constructor() {
    //let url = 'https://vr.fox-gieg.com/sounds/sgm_plus';
    //let url = 'https://vr.fox-gieg.com/rkhive/rk-download/banks/sgm_plus';
    let url = 'https://storage.googleapis.com/magentadata/js/soundfonts/sgm_plus';
    //let url = './sounds/sgm_plus';
    this.player = new mm.SoundFontPlayer(url);
    this.loadAllSamples();
  }
  
  loadAllSamples() {
    const seq = {notes:[]};
    for (let i = 0; i < CONSTANTS.NOTES_PER_OCTAVE * OCTAVES; i++) {
      seq.notes.push({pitch: CONSTANTS.LOWEST_PIANO_KEY_MIDI_NOTE + i});
    }
    this.player.loadSamples(seq);
  }
  
  playNoteDown(pitch, button) {
      mm.Player.tone.context.resume();
      this.player.playNoteDown({pitch:pitch});
  }
  
  playNoteUp(pitch, button) {
      this.player.playNoteUp({pitch:pitch});
  }
}
  
