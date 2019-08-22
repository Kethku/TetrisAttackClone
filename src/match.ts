import { Update } from "./events";
import { Block, BlockState, BlockType, dropBlock, deleteBlock } from "./block";
import { getBlock, gridBlockDimensions } from "./grid";
import { previousFilledY } from "./advance";
import { Vector } from "./math";
import { EventManager1 } from "./eventManager";

export const clearDelay = 15;
export const clearingTime = 15;
export const continueClearTime = 5;

export const matches = new Set();

export const MatchStarted = new EventManager1<Block[]>();
export const MatchCompleted = new EventManager1<Block[]>();

class Match {
  public blocks: Block[];
  public timer: number;

  constructor(matchBlocks: Block[]) {
    this.blocks = matchBlocks;
    this.timer = 0;

    for (let block of this.blocks) {
      block.state = BlockState.Matched;
      dropBlock(block);
    }
  }

  update() {
    if (this.timer < clearDelay) {
      this.timer++;
    } else {
      let anyClearing = false;
      for (let block of this.blocks) {
        if (block.state === BlockState.Matched) {
          block.state = BlockState.Clearing;
          anyClearing = true;
          break;
        } else if (block.state === BlockState.Clearing) {
          anyClearing = true;
          if (block.clearTimer > continueClearTime) {
            continue;
          }
          break;
        }
      }

      if (!anyClearing) {
        MatchCompleted.Publish(Array.from(this.blocks));
        for (let block of this.blocks) {
          block.state = BlockState.Cleared;
          deleteBlock(block);
        }
        return true;
      }
    }

    return false;
  }
}

function separateMatches(matchBlocks: Set<Block>) {
  let groups = [];
  while (matchBlocks.size != 0) {
    let seed = matchBlocks.values().next().value;
    let group = new Set<Block>();
    group.add(seed);

    let addedBlockToGroup: boolean;
    do {
      addedBlockToGroup = false;

      let blocksToRemove = [];

      for (let matchBlock of matchBlocks) {
        for (let groupBlock of group) {
          if (groupBlock.gridSlot.adjacentTo(matchBlock.gridSlot)) {
            group.add(matchBlock);
            blocksToRemove.push(matchBlock);
            addedBlockToGroup = true;
          }
        }
      }

      blocksToRemove.forEach(block => matchBlocks.delete(block));
    } while(addedBlockToGroup)

    groups.push(group);
  }

  return groups;
}

export function findNewMatches() {
  let matchBlocks = new Set<Block>();
  let currentMatch = [];
  let currentBlockType = null;

  function breakMatch(nextBlock: Block = undefined) {
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

  function processBlock(block: Block) {
    if (!block || (block.state !== BlockState.Waiting && block.state !== BlockState.Dragging) || block.type === BlockType.Garbage) {
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

  for (let y = -gridBlockDimensions.height; y <= previousFilledY; y++) {
    for (let x = 0; x < gridBlockDimensions.width; x++) {
      processBlock(getBlock(new Vector(x, y)));
    }
    breakMatch();
  }

  for (let x = 0; x < gridBlockDimensions.x; x++) {
    for (let y = -gridBlockDimensions.height; y <= previousFilledY; y++) {
      processBlock(getBlock(new Vector(x, y)));
    }
    breakMatch();
  }

  if (matchBlocks.size != 0) {
    let matchGroups = separateMatches(matchBlocks);
    for (let matchGroup of matchGroups) {
      matches.add(new Match(matchGroup));
      MatchStarted.Publish(Array.from(matchGroup));
    }
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
