//-----------------------------------------------------------------------------
// Sprite_Partition
//
// The sprite class for QTree partitions.

const Sprite_PartitionBorder = require('./Sprite_PartitionBorder');

function Sprite_Partition() {
    this.initialize.apply(this, arguments);
}

Sprite_Partition.prototype = Object.create(Sprite.prototype);
Sprite_Partition.prototype.constructor = Sprite_Partition;

Sprite_Partition.prototype.initialize = function (partition) {
    Sprite.prototype.initialize.call(this);
    this.setPartition(partition);
};

Sprite_Partition.prototype.setPartition = function (partition) {
    this._partition = partition;
    this._partitionChildrenSprites = [];
    this.width = $gameMap.tileWidth() * (partition.maxX - partition.minX);
    this.height = $gameMap.tileHeight() * (partition.maxY - partition.minY);
    this.x = 0;
    this.y = 0;
    if (partition.parent) {
        const index = partition.parent.children.findIndex(child => child === partition);
        switch (index) {
            case 0:
                break;
            case 1:
                this.x = this.width;
                break;
            case 2:
                this.y = this.height;
                break;
            case 3:
                this.x = this.width;
                this.y = this.height;
                break;
        }
    }
    this.setBorders();
};

Sprite_Partition.prototype.setBorders = function () {
    let index = null;
    if (this._partition.parent) {
        index = this._partition.parent.children.findIndex(child => child === this._partition);
    }
    for (let i = 0; i < 4; i++) {
        if (index === null) {
            this.addChild(new Sprite_PartitionBorder(this, i));
        } else {
            switch (index) {
                case 0: // top-left partition (draw right + bottom borders)
                    if (i === 1 || i === 2) this.addChild(new Sprite_PartitionBorder(this, i));
                    break;
                case 1: // top-right partition (draw bottom border)
                    if (i === 2) this.addChild(new Sprite_PartitionBorder(this, i));
                    break;
                case 2: // bottom-left partition (draw right border)  
                    if (i === 1) this.addChild(new Sprite_PartitionBorder(this, i));
                    break;
                case 3:
                    break;
            }
        }
    }
};

Sprite_Partition.prototype.update = function () {
    Sprite.prototype.update.call(this);
    if (!this._partition.parent) this.updatePosition();
    this.updateChildPartitionSprites();
};

Sprite_Partition.prototype.updatePosition = function () {
    this.x = this.screenX();
    this.y = this.screenY();
};

Sprite_Partition.prototype.updateChildPartitionSprites = function () {
    // create new sprites for new partitions
    if (this._partition.children) {
        this._partition.children.forEach(child => {
            if (!this.hasSpriteForPartitionChild(child)) {
                const sprite = new Sprite_Partition(child);
                this._partitionChildrenSprites.push(sprite);
                this.addChild(sprite);
            }
        });
    }
    // remove sprites for collapsed (non-existant) partitions
    if (this.shouldRemoveChildren()) {
        this._partitionChildrenSprites.forEach(sprite => this.removeChild(sprite));
        this._partitionChildrenSprites = [];
    }
};

// determine if has a sprite for child of partition
Sprite_Partition.prototype.hasSpriteForPartitionChild = function (partition) {
    return this._partitionChildrenSprites.some(sprite => sprite._partition === partition);
};

// determine if sprite children have been collapsed
Sprite_Partition.prototype.shouldRemoveChildren = function () {
    return this._partitionChildrenSprites.length && !this._partitionChildrenSprites[0]._partition.parent.children;
};

Sprite_Partition.prototype.scrolledX = function () {
    return $gameMap.adjustX(0);
};

Sprite_Partition.prototype.scrolledY = function () {
    return $gameMap.adjustY(0);
};

Sprite_Partition.prototype.screenX = function () {
    var tw = $gameMap.tileWidth();
    return Math.round(this.scrolledX() * tw);
};

Sprite_Partition.prototype.screenY = function () {
    var th = $gameMap.tileHeight();
    return Math.round(this.scrolledY() * th);
};

module.exports = Sprite_Partition;