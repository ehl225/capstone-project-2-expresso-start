const express = require('express');
const timesheetsRouter = express.Router({mergeParams: true});
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database( process.env.TEST_DATABASE || './database.sqlite');


timesheetsRouter.param('timesheetId', (req, res, next, timesheetId) => {
    const sql = `SELECT * FROM Timesheet WHERE Timesheet.id = ${timesheetId}`;
    db.get(sql, (error, timesheet) => {
        if (error) {
            next(error);
        } else if (timesheet) {
            req.timesheet = timesheet;
            next();
        } else {
            res.status(404).send();
        }
    });
});

timesheetsRouter.get('/', (req, res, next) => {
    const employeeId = req.params.employeeId;
    const sql = `SELECT * FROM Timesheet WHERE employee_id = ${employeeId}`;
    db.all(sql, (error, timesheets) => {
        if (error) {
            next(error);
        } else {
            res.status(200).json({ timesheets: timesheets});
        }
    });
});

timesheetsRouter.post('/', (req, res, next) => {
    const hours = req.body.timesheet.hours,
          rate = req.body.timesheet.rate,
          date = req.body.timesheet.date,
          employeeId = req.params.employeeId;
    if (!hours || !rate || !date) {
        return res.status(400).send();
    } else {
        const insertSql = 'INSERT INTO Timesheet (hours, rate, date, employee_id) VALUES ($hours, $rate, $date, $employeeId)';
        const insertValues = {
            $hours: hours,
            $rate: rate,
            $date: date,
            $employeeId: employeeId
        };
        db.run(insertSql, insertValues, function(error) {
            if (error) {
                next(error);
            } else {
                const selectSql = `SELECT * FROM Timesheet WHERE Timesheet.id = ${this.lastID}`;
                db.get(selectSql, (error, newTimesheet) => {
                    res.status(201).json({ timesheet: newTimesheet});
                });
            }
        });
    }
});

timesheetsRouter.put('/:timesheetId', (req, res, next) => {
    const hours = req.body.timesheet.hours,
          rate = req.body.timesheet.rate,
          date = req.body.timesheet.date,
          employeeId = req.params.employeeId,
          timesheetId = req.params.timesheetId;
    if ( !hours || !rate || !date) {
        return res.status(400).send();
    } else {
        const updateSql = 'UPDATE Timesheet SET hours = $hours, rate = $rate, date = $date, employee_id = $employeeId WHERE Timesheet.id = $timesheetId';
        const updateValues = {
            $hours: hours,
            $rate: rate,
            $date: date,
            $employeeId: employeeId,
            $timesheetId: timesheetId
        };
        db.run(updateSql, updateValues, (error) => {
            if (error) {
                next(error);
            } else {
                const selectSql = 'SELECT * FROM Timesheet WHERE Timesheet.id = $timesheetId';
                const selectValues = {
                    $timesheetId: req.params.timesheetId
                };
                db.get(selectSql, selectValues, (error, updatedTimesheet) => {
                    res.status(200).json({ timesheet: updatedTimesheet});
                });
            }
        });
    }
});

timesheetsRouter.delete('/:timesheetId', (req, res, next) => {
    const sql = 'DELETE FROM Timesheet WHERE Timesheet.id = $timesheetId';
    const values = {
        $timesheetId: req.params.timesheetId
    };
    db.run(sql, values, (error) => {
        if (error) {
            next(error);
        } else {
            res.sendStatus(204);
        }
    });
});

module.exports = timesheetsRouter;