//=============================================================================
// QTree
//=============================================================================
// Quadtrees are trees used to efficiently store data of points on a two-dimensional space. 
// In this tree, each node (Leaf) has four children.
//

Leaf.MAX_ENTITIES = Number(PluginManager.parameters('FreeMove')['max entities']) || 2;
Leaf.MIN_LEAF_SIZE = Number(PluginManager.parameters('FreeMove')['min Leaf size']) || 1;


function Leaf() {
	this.initialize.apply(this, arguments);
}

Leaf.prototype.initialize = function(minX, maxX, minY, maxY, parent = null) {
	// traversal
	this._parent = parent;
	// boundaries
	this._minX = minX;
	this._maxX = maxX;
	this._minY = minY;
	this._maxY = maxY;
	// contents 
	this._entities = [];
	this._childLeaves = null;
	this._canPartition = Math.min(this._maxX - this._minX, this._maxY - this._minY) / 2 > Leaf.MIN_LEAF_SIZE;
};

// RECURSIVE
Leaf.prototype.addEntity = function(entity) {
	if (!this._childLeaves) {
		this._entities.push(entity);
		this.updatePartitions();
	} else {
		this._childLeaves
		  .filter(child => child.shouldEntityBeHere(entity))
		  .forEach(child => child.addEntity(entity));
	}
};

// RECURSIVE
  // iterate through nodes, removing entity if no longer appropriate + adding if now appropriate
	// used after entity movement to readjust placement in QTree
Leaf.prototype.updateEntity = function(entity) {
	if (!this._childLeaves) {
		if (this.hasEntity(entity) && !this.shouldEntityBeHere(entity)) {
			this.removeEntityHere(entity);
		} else if (!this.hasEntity(entity) && this.shouldEntityBeHere(entity)) {
			this.addEntity(entity);
		}
	} else {
		this._childLeaves.forEach(child => child.updateEntity(entity));
	}
};

// RECURSIVE
  // removes entity from the entire QTree 
	// (do not use to remove from single node; for that, use removeEntityHere())
Leaf.prototype.removeEntity = function(entity) {
	if (this.hasEntity(entity)) {
		this.removeEntityHere(entity);
	}
	if (this._childLeaves) this._childLeaves.forEach(child => child.removeEntity(entity));
};

Leaf.prototype.removeEntityHere = function(entity) {
	this._entities = this._entities.filter(existingEntity => existingEntity !== entity);
};

Leaf.prototype.shouldEntityBeHere = function(entity) {
	return !(this._maxX <= entity.x1 || entity.x2 < this._minX) && !(this._maxY <= entity.y1 || entity.y2 < this._minY);
};

Leaf.prototype.hasEntity = function(entity) {
	return this._entities.includes(entity);
};

// called on root node, update to collapse one necessary partition per frame (deferred cleanup)
Leaf.prototype.update = function() {
	if (!this._parent) {
		this.updateCollapses();
	}
};

// RECURSIVE
  // called after every added entity to a node such that partitions are immediately constructed as needed
	// Q: why not defer like in updateCollapses?  
	// A: because the number of checks required to determine collision is directly correlated with the number of entities 
	//    in a given partition, we can reduce the number of checks as soon as possible
Leaf.prototype.updatePartitions = function() {
	if (this.needsPartition()) {
		this.partition();
		this.updatePartitions();
	} else if (this.needsPartitionDeepCheck()) {
		this._childLeaves
		  .filter(child => child.needsPartitionDeepCheck())
		  .forEach(child => child.updatePartitions());
	}
};

// RECURSIVE 
  // collapses at most one partition per frame such that the node structure "defers cleanup"
	// https://stackoverflow.com/questions/41946007/efficient-and-well-explained-implementation-of-a-quadtree-for-2d-collision-det
	// Q: why not collapse partitions immediately after entity removal like in updatePartitions()?
	// A: we defer partition clean up because empty partitions do not correlate to more checks (no entities inside to check)
	//    any given frame may see the removal of one entity from a partition and the addition of another into the same
	//    because we aren't penalized with more checks by deferring clean up, we optimize instead for reducing unnecessary Leaf
	//    destruction + recreation
Leaf.prototype.updateCollapses = function() {
	if (this.needsCollapse()) {
		this.collapse();
	} else if (this.needsCollapseDeepCheck()) {
		this._childLeaves.find(child => child.needsCollapseDeepCheck()).updateCollapses();
	}
};

// subdivide into four Leaf children and redistribute entities
Leaf.prototype.partition = function() {
	if (this._childLeaves) return; // don't repartition already partitioned node
	// create new children
	const children = [];
	const width = this._maxX - this._minX;
	const height = this._maxY - this._minY;
	children.push(new Leaf(this._minX, this._minX + width / 2, this._minY, this._minY + height / 2, this));
	children.push(new Leaf(this._minX + width / 2, this._maxX, this._minY, this._minY + height / 2, this));
	children.push(new Leaf(this._minX, this._minX + width / 2, this._minY + height / 2, this._maxY, this));
	children.push(new Leaf(this._minX + width / 2, this._maxX, this._minY + height / 2, this._maxY, this));
	this._childLeaves = children;
	// redistribute entities among new children
	while (this._entities.length) this.addEntity(this._entities.pop());
};

// collapse child nodes + redistribute entities inside self
Leaf.prototype.collapse = function() {
	if (!this._childLeaves) return; 
	// adopt entities from immediate children
	this._childLeaves.forEach(child => {
		child._entities.forEach(entity => {
			if (!this._entities.includes(entity)) this._entities.push(entity);
		});
		child._entities = [];
	});
	this._childLeaves = null;
};

// RECURSIVE 
  // determine if Leaf or any child Leaves require partition
Leaf.prototype.needsPartitionDeepCheck = function() {
	if (this._childLeaves) {
		return this._childLeaves.some(child => child.needsPartitionDeepCheck());
	}
	return this.needsPartition();
}

// determine if Leaf requires partition
Leaf.prototype.needsPartition = function() {
	return this.canPartition() && this._entities.length > Leaf.MAX_ENTITIES;
}

// RECURSIVE 
  // determine if Leaf or any child Leaves require collapse
Leaf.prototype.needsCollapseDeepCheck = function() {
	if (this.needsCollapse()) {
		return true;
	} else if (this._childLeaves) {
		return this._childLeaves.some(child => child.needsCollapseDeepCheck());
	}
	return false;
};

// determine if Leaf requires collapse
Leaf.prototype.needsCollapse = function() {
	// is closest parent node with end-node children that has fewer than threshold partition entities
	return !!this._childLeaves && this.entityCountDeep() <= Leaf.MAX_ENTITIES && !this._childLeaves.some(child => child._childLeaves);
};

// get total unique _entities in this Leaf and all child Leaves (calls recursive)
Leaf.prototype.entityCountDeep = function() {
	const list = [];
	this.entityListDeep(list); // populate list
	return list.length;
};

// RECURSIVE 
  // iterate through nodes to append unique entities in tree to a list 
Leaf.prototype.entityListDeep = function(list = []) {
	if (this._entities.length) {
		this._entities.forEach(entity => !list.includes(entity) && list.push(entity));
	} else if (this._childLeaves) {
		this._childLeaves.forEach(child => child.entityListDeep(list));
	}
}

// return precalculated partition-able status basd on Leaf dimensions and MIN_LEAF_SIZE
Leaf.prototype.canPartition = function() {
	return this._canPartition;
};

// get unique characters in tree whose parent Leaves overlap with given bounding box
Leaf.prototype.entitiesInBoundingBox = function(entities, minX, maxX, minY, maxY) {
	// check for no overlap
	if (this._minX > maxX || minX > this._maxX || this._minY > maxY || minY > this._maxY) return;
	// add entities to aggregating array
	if (this._entities.length) {
		this._entities
		  .filter(entity => !entities.includes(entity))
		  .forEach(entity => entities.push(entity));
	} else if (this._childLeaves) {
		// check children
		this._childLeaves.forEach(child => child.entitiesInBoundingBox(entities, minX, maxX, minY, maxY));
	}
};

module.exports = Leaf;