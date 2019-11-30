//=============================================================================
// QTree
//=============================================================================
// Quadtrees are trees used to efficiently store data of points on a two-dimensional space. 
// In this tree, each node (Leaf) has four children.
//

import { each, every, includes, some } from "lodash";
import "./rpg_sprites/Spriteset_Map";

const MAX_ENTITIES = Number(PluginManager.parameters('FreeMove')['max entities']) || 2;
const MIN_LEAF_SIZE = Number(PluginManager.parameters('FreeMove')['min Leaf size']) || 1;


class Leaf {
  constructor(minX, maxX, minY, maxY, parent) {
    this.parent = parent;

    this.minX = minX;
    this.maxX = maxX;
    this.minY = minY;
    this.maxY = maxY;
     
    this.entities = [];
    this.children = null;
    this.canPartition = Math.min(this.maxX - this.minX, this.maxY - this.minY) / 2 > MIN_LEAF_SIZE;
  };

  addEntity(entity) {
    if (!this.children) {
      this.entities.push(entity);
      this.updatePartitions();
    } else {
      each(this.children, child => {
        if (child.shouldEntityBeHere(entity)) child.addEntity(entity);
      });
    }
  };

  updateEntity(entity) {
    if (!this.children) {
      if (this.hasEntity(entity) && !this.shouldEntityBeHere(entity)) {
        this.removeEntityHere(entity);
      } else if (!this.hasEntity(entity) && this.shouldEntityBeHere(entity)) {
        this.addEntity(entity);
      }
    } else {
      each(this.children, child => child.updateEntity(entity));
    }
  };

  // (do not use to remove from single node; for that, use removeEntityHere())
  removeEntity(entity) {
    if (this.hasEntity(entity)) this.removeEntityHere(entity);
    if (this.children) each(this.children, child => child.removeEntity(entity));
  };

  removeEntityHere(entity) {
    this.entities = this.entities.filter(existingEntity => existingEntity !== entity);
  };

  shouldEntityBeHere(entity) {
    return !(this.maxX <= entity.x1 || entity.x2 < this.minX) && !(this.maxY <= entity.y1 || entity.y2 < this.minY);
  };

  hasEntity(entity) {
    return includes(this.entities, entity);
  };

  // called after every added entity to a node such that partitions are immediately constructed as needed
	// Q: why not defer like in updateCollapses?  
	// A: because the number of checks required to determine collision is directly correlated with the number of entities 
	//    in a given partition, we can reduce the number of checks as soon as possible
  updatePartitions() {
    if (this.needsPartition()) {
      this.partition();
      this.updatePartitions();
    } else if (this.needsPartitionDeepCheck()) {
      each(this.children, child => {
        if (child.needsPartitionDeepCheck()) child.updatePartitions();
      });
    }
  };

  // collapses at most one partition per frame such that the node structure "defers cleanup"
	// https://stackoverflow.com/questions/41946007/efficient-and-well-explained-implementation-of-a-quadtree-for-2d-collision-det
	// Q: why not collapse partitions immediately after entity removal like in updatePartitions()?
	// A: we defer partition clean up because empty partitions do not correlate to more checks (no entities inside to check)
	//    any given frame may see the removal of one entity from a partition and the addition of another into the same
	//    because we aren't penalized with more checks by deferring clean up, we optimize instead for reducing unnecessary Leaf
	//    destruction + recreation
  updateCollapses() {
    if (this.needsCollapse()) {
      this.collapse();
    } else if (this.needsCollapseDeepCheck()) {
      each(this.children, child => {
        if (child.needsCollapseDeepCheck()) child.updateCollapses();
      });
    }
  };

  partition() {
    if (this.children) return; // don't repartition already partitioned node
    
    const children = [];
    const width = this.maxX - this.minX;
    const height = this.maxY - this.minY;

    children.push(new Leaf(this.minX, this.minX + width / 2, this.minY, this.minY + height / 2, this));
    children.push(new Leaf(this.minX + width / 2, this.maxX, this.minY, this.minY + height / 2, this));
    children.push(new Leaf(this.minX, this.minX + width / 2, this.minY + height / 2, this.maxY, this));
    children.push(new Leaf(this.minX + width / 2, this.maxX, this.minY + height / 2, this.maxY, this));

    this.children = children;
    
    // redistribute entities among new children
    while (this.entities.length) this.addEntity(this.entities.pop());
  };

  collapse() {
    if (!this.children) return; 
    
    // adopt entities from immediate children
    each(this.children, child => {
      each(child.entities, entity => {
        if (!includes(this.entities, entity)) this.entities.push(entity);
      });
      child.entities = [];
    });
    this.children = null;
  };

  needsPartitionDeepCheck() {
    if (this.children) return some(this.children, child => child.needsPartitionDeepCheck());
    return this.needsPartition();
  }

  needsPartition() {
    return this.canPartition && this.entities.length > MAX_ENTITIES;
  }

  needsCollapseDeepCheck() {
    if (this.needsCollapse()) return true;
    else if (this.children) return some(this.children, child => child.needsCollapseDeepCheck());
    return false;
  };

  needsCollapse() {
    // is closest parent node with end-node children that has fewer than threshold partition entities
    return this.children && this.entityCountDeep() <= MAX_ENTITIES && every(this.children, child => !child.children);
  };

  // get total unique entities in this Leaf and all child Leaves
  entityCountDeep() {
    const list = [];
    this.entityListDeep(list); // populate list
    return list.length;
  };

  // iterate through nodes to append unique entities in tree to a list 
  entityListDeep(list = []) {
    if (this.entities.length) {
      each(this.entities, entity => {
        if (!includes(list, entity)) list.push(entity);
      });
    } else if (this.children) {
      each(this.children, child => child.entityListDeep(list));
    }
  }

  // get unique characters in tree whose parent Leaves overlap with given bounding box
  entitiesInBoundingBox(entities, minX, maxX, minY, maxY) {
    // check for no overlap
    if (this.minX > maxX || minX > this.maxX || this.minY > maxY || minY > this.maxY) return;
    // add entities to aggregating array
    if (this.entities.length) {
      each(this.entities, entity => {
        if (!includes(entities, entity)) entities.push(entity);
      });
    } else if (this.children) {
      each(this.children, child => child.entitiesInBoundingBox(entities, minX, maxX, minY, maxY));
    }
  };
};


export default class QTree extends Leaf {
  constructor(...args) {
    super(...args);

    this._allEntities = [];
  }

  addEntity(entity) {
    if (this._allEntities.includes(entity)) return;
    this._allEntities.push(entity);
    super.addEntity(entity);
  };

  removeEntity(entity) {
    const indexOfEntity = this._allEntities.indexOf(entity);
    if (indexOfEntity > -1) this._allEntities.splice(indexOfEntity, 1);
    super.removeEnt(entity);
  };

  update() {
    this.updateCollapses();
    this._allEntities.forEach(entity => this.updateEntity(entity));
  };
};