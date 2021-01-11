const express = require('express');
const menuItemsRouter = express.Router({mergeParams: true});
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database( process.env.TEST_DATABASE || './database.sqlite');

menuItemsRouter.param('menuItemId', (req, res, next, menuItemId) => {
    const sql = `SELECT * FROM MenuItem WHERE MenuItem.id = ${menuItemId}`;
    db.get(sql, (error, menuItem) => {
        if (error) {
            next(error);
        } else if (menuItem) {
            req.menuItem = menuItem;
            next();
        } else {
            res.status(404).send();
        }
    })
});

menuItemsRouter.get('/', (req, res, next) => {
    const sql = `SELECT * FROM MenuItem WHERE MenuItem.menu_id = ${req.params.menuId}`;
    db.all(sql, (error, menuItems) => {
        if (error) {
            next(error);
        } else {
            res.status(200).json({menuItems: menuItems});
        }
    });
});

menuItemsRouter.post('/', (req, res, next) => {
    const name = req.body.menuItem.name,
          description = req.body.menuItem.description,
          inventory = req.body.menuItem.inventory,
          price = req.body.menuItem.price, 
          menuId = req.params.menuId;
    if (!name || !inventory || !price) {
        return res.status(400).send();
    } else {
        const insertSql = 'INSERT INTO MenuItem (name, description, inventory, price, menu_id) VALUES ($name, $description, $inventory, $price, $menuId)';
        const insertValues = {
            $name: name,
            $description: description,
            $inventory: inventory,
            $price: price,
            $menuId: menuId
        };
        db.run(insertSql, insertValues, function(error) {
            if (error) {
                next(error);
            } else {
                const selectSql = `SELECT * FROM MenuItem WHERE MenuItem.id = ${this.lastID}`;
                db.get(selectSql, (error, newMenuItem) => {
                    res.status(201).send({menuItem: newMenuItem});
                });
            }
        })
    }
});

menuItemsRouter.put('/:menuItemId', (req, res, next) => {
    const name = req.body.menuItem.name,
          description = req.body.menuItem.description,
          inventory = req.body.menuItem.inventory,
          price = req.body.menuItem.price,
          menuId = req.params.menuId;
    const selectMenuSql = 'SELECT * FROM Menu WHERE Menu.id = $menuId'; 
    const selectMenuValues = {
        $menuId: menuId
    };
    db.get(selectMenuSql, selectMenuValues, function(error, menu) {
        if(error) {
            next(error);
        } else {
            if (!name || !inventory || !price || !menu) {
                return res.status(400).send();
            } else {
                const updateMenuItemSql = 'UPDATE MenuItem SET name = $name, description = $description, inventory = $inventory, price = $price, menu_id = $menuId WHERE MenuItem.id = $menuItemId';
                const updateMenuItemValues = {
                    $name: name,
                    $description: description,
                    $inventory: inventory,
                    $price: price,
                    $menuId: menuId,
                    $menuItemId: req.params.menuItemId
                };
                db.run(updateMenuItemSql, updateMenuItemValues, function(error) {
                    if (error) {
                        next(error);
                    } else {
                        const selectMenuItemSql = 'SELECT * FROM MenuItem WHERE MenuItem.id = $menuItemId';
                        const selectMenuItemValues = {
                            $menuItemId: req.params.menuItemId
                        };
                        db.get(selectMenuItemSql, selectMenuItemValues, (error, menuItem) => {
                            res.status(200).json({menuItem: menuItem});
                        });
                    }
                });
            }
        }
    });
});

menuItemsRouter.delete('/:menuItemId', (req, res, next) => {
    const sql = `DELETE FROM MenuItem WHERE MenuItem.id = ${req.params.menuItemId}`;
    db.run(sql, (error) => {
        if (error) {
            next(error);
        } else {
            res.status(204).send();
        }
    });
});


module.exports = menuItemsRouter;
