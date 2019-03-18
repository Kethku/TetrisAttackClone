import { Update } from "./events";
import { state, dropBlock, deleteBlock } from "./block";
import { previousFilledY, blocks, gridBlockDimensions } from "./grid";

/////////////////////////////
// Deal with parcel reload //
/////////////////////////////
import { refreshOnReload } from "./utils";
refreshOnReload(module);

export const clearDelay = 15;
export const clearingTime = 15;
export const continueClearTime = 5;

export const matches = new Set();

class Match {
  constructor(matchBlocks) {
    this.blocks = matchBlocks;
    this.timer = 0;

    for (let block of this.blocks) {
      block.state = state.MATCHED;
      dropBlock(block);
    }
  }

  update() {
    if (this.timer < clearDelay) {
      this.timer++;
    } else {
      let anyClearing = false;
      for (let block of this.blocks) {
        if (block.state === state.MATCHED) {
          block.state = state.CLEARING;
          anyClearing = true;
          break;
        } else if (block.state === state.CLEARING) {
          anyClearing = true;
          if (block.clearTimer > continueClearTime) {
            continue;
          }
          break;
        }
      }

      if (!anyClearing) {
        for (let block of this.blocks) {
          deleteBlock(block);
        }
        return true;
      }
    }

    return false;
  }
}

function findNewMatches() {
  let matchBlocks = new Set();
  let currentMatch = [];
  let currentBlockType = null;

  function breakMatch(nextBlock) {
    if (currentMatch.length >= 3) {
      for (let block of currentMatch) {
        matchBlocks.add(block);
      }
    }
    if (nextBlock) {
      currentMatch = [nextBlock];
      currentBlockType = nextBlock.type;
    } else {
      currentMatch = [];
      currentBlockType = null;
    }
  }

  function processBlock(block) {
    if (block && (block.state !== state.WAITING && block.state !== state.DRAGGING)) {
      breakMatch();
      return;
    }

    if (currentBlockType == null && block) {
      currentBlockType = block.type;
      currentMatch.push(block);
      return;
    }

    if (!block) {
      breakMatch();
      return;
    }

    if (block.type !== currentBlockType) {
      breakMatch(block);
    } else {
      currentMatch.push(block);
    }
  }

  for (let y = 1; y <= previousFilledY; y++) {
    let row = blocks[y];
    if (!row) continue;
    for (let x = 0; x < gridBlockDimensions.x; x++) {
      processBlock(row[x]);
    }
    breakMatch();
  }

  for (let x = 0; x < gridBlockDimensions.x; x++) {
    for (let y = 1; y <= previousFilledY; y++) {
      let row = blocks[y];
      if (!row) continue;
      processBlock(row[x]);
    }
    breakMatch();
  }

  if (matchBlocks.size != 0) {
    matches.add(new Match(matchBlocks));
  }
}

Update.Subscribe(() => {
  findNewMatches();

  let finishedMatches = [];
  for (let match of matches) {
    if (match.update()) {
      finishedMatches.push(match);
    }
  }

  for (let finishedMatch of finishedMatches) {
    matches.delete(finishedMatch);
  }
});
