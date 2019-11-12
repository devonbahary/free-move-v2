# QTree
> Quadtrees are trees used to efficiently store data of points on a two-dimensional space.  
> In this tree, each node (Leaf) has four children.
>

https://en.wikipedia.org/wiki/Quadtree  
https://www.geeksforgeeks.org/quad-tree/amp/

![QTree in action](../../assets/QTree.gif)

## Why QTree
Unlike reality, objects in a game have no concept of proximity or relationship to other objects in game "space".

Conventionally, the game map tracks all game objects. To check if any moving object collides into another object, it performs a collision check for that object with **every other object** on the map.

This works well enough with small numbers of objects, but becomes **computationally expensive** with large numbers of objects; especially when every object is moving and checking against one another `O(n^2)`. 

The **QTree is an implementation to give objects relationship to one another according to their proximity**, offering a heuristic for object collision.

We will call these game objects **entities**.

---

## API
Init QTree:
`const qTree = new Leaf(0, $gameMap.width(), 0, $gameMap.height());`

Add entity:
`qTree.addEntity($gamePlayer);`

Update entity's location in spatial map (call after each movement):
`qTree.updateEntity($gamePlayer);`

Remove entity from spatial map:
`qTree.removeEntity($gamePlayer);`

Call at end of each frame to collapse unnecessary Leaves (QTree maintenance):
`qTree.update();`

---

## How It Works

### Getting Started
A QTree begins with a single **Leaf** (head node). This Leaf spans the dimensions of the game map. 

```
// (minX, maxX, minY, maxY)
const qTree = new Leaf(0, mapWidth, 0, mapHeight);
```

As entities are added to the map, they should be added to the QTree (the head Leaf node).  

`qTree.addEntity(entity);`

An entity should only concern itself with colliding into other entities within a given boundary box (i.e., its path of movement, range of attack, etc.) and not entities on the opposite side of the map.

To query which entities exist for a given boundary box, use:  

`qTree.entitiesInBoundingBox(minX, maxX, minY, maxY)`

This query will find the Leaves in the QTree that have any overlap with the boundary box specified and return their stored entities. 

> NOTE: The QTree does not know which entity is concerned with this call, and in many cases will return that same entity if it overlaps with the passed boundary box. It may be necessary to prevent an entity with checking for collision with itself.

For now, the head Leaf is the only member of the QTree and it spans the entire game map. Querying the QTree at this point will return every entity on the map.

Nothing has changed so far about our computational efficiency.

---

### Partitioning
When a Leaf starts holding too many entities, it subdivides and redistributes them.

This process is called **partitioning**, where the Leaf generates 4 new child Leaves that represent equal quadrants of the parent Leaf on the game map and redistributes its entities into the new children based on which child Leaves the entities overlap (the entity positioning and size).

Partitioning removes entities from the parent Leaf, and for this reason, entities are only ever stored in the end-nodes of the QTree.

> NOTE: `addEntity(...)` and all other functions should still be called on the head node, because the QTree manages where to place entities through recursive calls on its child nodes.


Now with partitioning, we begin to see optimizations for `entitiesInBoundingBox(...)` when the bounding box spans over few or just one child Leaves, returning only those Leaves' stored entities and not entities spanning the entire game map which are of no concern to us.

The **primary goal of the QTree** is to minimize the number of entities returned by `entitiesInBoundingBox(...)`, thereby reducing the number of expensive collision checks made on the other side of that call.

---

### Updating Entities
When an entity changes its position, it should change the Leaves it belongs to.

`qTree.updateEntity(entity);`

Targeting our head node again, we pass the entity whose coordinates have changed, and the QTree will recursively update its Leaves to either remove the entity if it no longer overlaps with the subject Leaf or to add it if it now does.

**At the end of each entity's movement**, `qTree.updateEntity(...)` should be called for that entity so that its location in the QTree can be up-to-date.

---

### Collapsing
As Leaves further subdivide to accomodate more entities, we have the unintended consequence of **increasing the number of Leaves we have to traverse** in order to find entities stored at the end-nodes of these Leaves.

When a parent Leaf can store all of its child Leaves' entities on its own without surpassing the entity limit, it **collapses** its child Leaves into itself and takes on their entities. 

This is a "clean-up" of the QTree to undo deep partitions that are no longer needed, **reducing the number of Leaf iterations**. 

---

### Balancing QTree Maintenance
We should consider now that for any given frame, entities will move into some Leaves (potentially triggering partitions) and exit others (potentially triggering collapses). 

Consider the following examples of **unnecessary Leaf creation/destruction and entity redistribution**:

> A Leaf collapses when one entity leaves it, but then has to repartition to its former state once another entity enters it.

> A Leaf partitions when one entity enters it, but then collapses to its former state once another entity leaves it.

Also consider that these things could happen multiple times in a single frame.

An **optimization** we can use is to *delay QTree maintenance* until the end of the frame, waiting for all entities to have had their turn to enter/exit Leaves.

However, this means that at any given moment *within* a frame, a Leaf may be occupied by a number of entities that *exceed* our threshold limit. 

If the **primary goal** of the QTree is to reduce the number of entities returned by `entitiesInBoundingBox()`, then we want to partition as soon the threshold limit is crossed.

However, we *can* delay the collapsing of Leaves until the end of the frame in order to meet our new QTree maintenance optimization *without* violating our **primary goal**. This is because *we will never return more entities than necessary by having more empty Leaves than we need*.

---

### Implementing Our Optimizations

In summary:
- **Partitions** need to happen as required  as soon as `addEntity(...)` is called. We concede the potential cost of partitioning a Leaf that will very shortly be collapsed so that our **primary goal** of always returning the fewest entities for `entitiesInBoundingBox(...)` is met.
- **Collapses** can be deferred until the *end of the frame* in order to gain optimizations in unnecessary Leaf creation/destruction and entity redistribution because having more Leaves than we need at any given point within a frame has no impact on our **primary goal**.

To this end, **partitions are handled automatically** on `addEntity(...)` calls and require no implicit call to the QTree to implement.

However, **collapses require an implicit call** at the end of each frame, and can be done by calling:

`qTree.update();`

---

### Caveats

If the max entity threshold is sufficiently low, you can imagine a scenario in which enough clustered entities together would subdivide into so many partitions that each Leaf would attempt to contain a single entity each. 

If our queries with `entitiesInBoundingBox(...)` end up spanning over several tiny Leaf nodes, their size becomes redundant and they might as well collapse into a larger containing Leaf.

For this reason, a minimum Leaf size should be configured to be something larger than the size of the average entity.

---