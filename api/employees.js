const express = require('express');
const employeesRouter = express.Router();
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database( process.env.TEST_DATABASE || './database.sqlite');

const timesheetsRouter = require('./timesheets.js');
employeesRouter.use('/:employeeId/timesheets', timesheetsRouter);


employeesRouter.param('employeeId', (req, res, next, employeeId) => {
    const sql = `SELECT * FROM Employee WHERE Employee.id = ${employeeId}`;
    db.get(sql, (error, employee) => {
        if (error) {
            next(error);
        } else if (employee) {
            req.employee = employee;
            next();
        } else {
            res.status(404).send();
        }
    });
});

employeesRouter.get('/', (req, res, next) => {
    const sql = 'SELECT * FROM Employee WHERE is_current_employee = 1';
    db.all(sql, (error, employees) => {
        if(error) {
            next(error);
        } else {
            res.status(200).json({ employees: employees });
        }
    });
});
employeesRouter.post('/', (req, res, next) => {
    const name = req.body.employee.name,
          position = req.body.employee.position,
          wage = req.body.employee.wage,
          isCurrentEmployee = req.body.employee.isCurrentEmployee === 0 ? 0 : 1;
    if (!name || !position || !wage || !isCurrentEmployee) {
        return res.status(400).send();
    } else {
        const insertSql = 'INSERT INTO Employee (name, position, wage, is_current_employee) VALUES ($name, $position, $wage, $isCurrentEmployee)';
        const insertValues = {
            $name: name, 
            $position: position, 
            $wage: wage, 
            $isCurrentEmployee: isCurrentEmployee
        };
        db.run(insertSql, insertValues, function(error) {
            if (error) {
                next(error);
            } else {
                const selectSql = `SELECT * FROM Employee WHERE Employee.id = ${this.lastID}`;
                db.get(selectSql, (error, newEmployee) => {
                   return res.status(201).json({ employee: newEmployee});
                });
                }
            });
        }
});

employeesRouter.get('/:employeeId', (req, res, next) => {
    res.status(200).json({ employee: req.employee});
});

employeesRouter.put('/:employeeId', (req, res, next) => {
    const name = req.body.employee.name,
          position = req.body.employee.position,
          wage = req.body.employee.wage,
          isCurrentEmployee = req.body.employee.isCurrentEmployee === 0 ? 0 : 1;
    if (!name || !position || !wage || !isCurrentEmployee) {
        return res.status(400).send();
    } else {
        const updateSql = 'UPDATE Employee SET name = $name, position = $position, wage = $wage, is_current_employee = $isCurrentEmployee WHERE Employee.id = $employeeId';
        const updateValues = {
            $name: name,
            $position: position,
            $wage: wage,
            $isCurrentEmployee: isCurrentEmployee,
            $employeeId: req.params.employeeId
        };

        db.run(updateSql, updateValues, (error) => {
            if (error) {
                next(error);
            } else {
                const selectSql = 'SELECT * FROM Employee WHERE Employee.id = $employeeId';
                const selectValues = {
                    $employeeId: req.params.employeeId
                };
                db.get(selectSql, selectValues, (error, updatedEmployee) => {
                    res.status(200).json({ employee: updatedEmployee});
                });
            }
        })
    }
});

employeesRouter.delete('/:employeeId', (req, res, next) => {
    const employeeId = req.params.employeeId;
    const updateSql = 'UPDATE Employee SET is_current_employee = 0 WHERE Employee.id = $employeeId';
    const updateValues = {
        $employeeId: employeeId
    };
    db.run(updateSql, updateValues, function (error) {
        if (error) {
            next(error);
        } else {
            const selectSql = 'SELECT * FROM Employee WHERE Employee.id = $employeeId';
            const selectValues = {
                $employeeId: employeeId
            };
            db.get(selectSql, selectValues, (error, updatedEmployee) => {
                res.status(200).json({ employee: updatedEmployee});
            });
        }
    });
});
module.exports = employeesRouter;