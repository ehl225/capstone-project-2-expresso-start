const express = require('express');
const menusRouter = express.Router();
const menuItemsRouter = require('./menuItems.js');
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database( process.env.TEST_DATABASE || './database.sqlite');


menusRouter.param('menuId', (req, res, next, menuId) => {
    const sql = `SELECT * FROM Menu WHERE Menu.id = ${menuId}`;
    db.get(sql, (error, menu) => {
        if (error) {
            next(error);
        } else if (menu) {
            req.menu = menu;
            next();
        } else {
            res.status(404).send();
        }
    });
});

menusRouter.use('/:menuId/menu-items', menuItemsRouter);

menusRouter.get('/', (req, res, next) => {
    const sql = 'SELECT * FROM Menu';
    db.all(sql, (error, menus) => {
        if (error) {
            next(error);
        } else {
            res.status(200).json({ menus: menus});
        }
    });
});

menusRouter.post('/', (req, res, next) => {
    const title = req.body.menu.title;
    if (!title) { 
       return res.status(400).send();
    } else {
        const insertSql = `INSERT INTO Menu (title) VALUES ($title)`;
        const insertValues = {
            $title: title
        };
        db.run(insertSql, insertValues, function(error) {
            if (error) {
                next(error);
            } else {
                const selectSql = `SELECT * FROM Menu WHERE Menu.id = ${this.lastID}`;
                db.get(selectSql, (error, menu) => {
                    res.status(201).json({ menu: menu});
                });
            }
        });
    }
});

menusRouter.get('/:menuId', (req, res, next) => {
    res.status(200).json({menu: req.menu});
});

menusRouter.put('/:menuId', (req, res, next) => {
    const title = req.body.menu.title;
    if (!title) {
        return res.status(400).send();
    } else {
        const updateSql = 'UPDATE Menu SET title = $title WHERE Menu.id = $menuId';
        const updateValues = {
            $title: title,
            $menuId: req.params.menuId
        };
        db.run(updateSql, updateValues, (error) => {
            if (error) {
                next(error);
            } else {
                const selectSql = `SELECT * FROM Menu WHERE Menu.id = ${req.params.menuId}`;
                db.get(selectSql, (error, updatedMenu) => {
                    res.status(200).json({ menu: updatedMenu});
                });
            }
        });
    }
});

menusRouter.delete('/:menuId', (req, res, next) => {
    const menuItemSql = 'SELECT * FROM MenuItem WHERE MenuItem.menu_id = $menuId';
    const menuItemValues = {
        $menuId: req.params.menuId
    };
    db.get(menuItemSql, menuItemValues, (error, menuItem) => {
        if (error) {
            next(error);
        } else if (menuItem) {
            return res.status(400).send();
        } else {
            const deleteMenuSql = 'DELETE FROM Menu WHERE Menu.id = $menuId';
            const deleteMenuValues = {
                $menuId: req.params.menuId
            };
            db.run(deleteMenuSql, deleteMenuValues, (error) => {
                if (error) {
                    next(error);
                } else {
                    res.status(204).send();
                }
            });
        }
    });
});

module.exports = menusRouter;