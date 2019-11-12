//-----------------------------------------------------------------------------
// Sprite_PartitionBorder
//
// The sprite for displaying Sprite_Partition borders.


Sprite_PartitionBorder.BORDER_THICKNESS = Number(PluginManager.parameters('FreeMove')['grid border thickness']) || 4;
Sprite_PartitionBorder.BORDER_COLOR = PluginManager.parameters('FreeMove')['grid border color'] || 'blue';


function Sprite_PartitionBorder() {
    this.initialize.apply(this, arguments);
}

Sprite_PartitionBorder.prototype = Object.create(Sprite.prototype);

Sprite_PartitionBorder.prototype.initialize = function (parent, index) {
    Sprite.prototype.initialize.call(this);
    this._parent = parent;
    switch (index) {
        case 0: // top
            this.setAsTop();
            break;
        case 1: // right 
            this.setAsRight();
            break;
        case 2: // down 
            this.setAsBottom();
            break;
        case 3: // left 
            this.setAsLeft();
            break;
    }
};

Sprite_PartitionBorder.prototype.setAsTop = function () {
    this.bitmap = new Bitmap(this._parent.width, this.borderThickness());
    this.bitmap.fillAll(this.borderColor());
};

Sprite_PartitionBorder.prototype.setAsRight = function () {
    this.bitmap = new Bitmap(this.borderThickness(), this._parent.height);
    this.bitmap.fillAll(this.borderColor());
    this.x = this._parent.width - this.borderThickness();
};

Sprite_PartitionBorder.prototype.setAsBottom = function () {
    this.bitmap = new Bitmap(this._parent.width, this.borderThickness());
    this.bitmap.fillAll(this.borderColor());
    this.y = this._parent.height - this.borderThickness();
};

Sprite_PartitionBorder.prototype.setAsLeft = function () {
    this.bitmap = new Bitmap(this.borderThickness(), this._parent.height);
    this.bitmap.fillAll(this.borderColor());
};

Sprite_PartitionBorder.prototype.borderThickness = function () {
    return Sprite_PartitionBorder.BORDER_THICKNESS;
};

Sprite_PartitionBorder.prototype.borderColor = function () {
    return Sprite_PartitionBorder.BORDER_COLOR;
};

module.exports = Sprite_PartitionBorder;