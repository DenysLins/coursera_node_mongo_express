const express = require('express');
const bodyParser = require('body-parser');
const Favorites = require('../models/favorite');
const favoriteRouter = express.Router();
const authenticate = require('../authenticate');
const cors = require('./cors');

favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')
    .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
    .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
        Favorites.find({ 'user': req.user._id })
            .populate('user')
            .populate('dishes')
            .then((favorites) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorites);
            }, (err) => next(err))
            .catch((err) => next(err));
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorites.findOne({ "user": req.user._id })
            .then((favorites) => {
                if (favorites == null) {
                    Favorites.create({
                        'user': req.user._id,
                        'dishes': req.body
                    })
                        .then((favorite) => {
                            console.log('Favorite Created ', favorite);
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(favorite);
                        }, (err) => next(err))
                        .catch((err) => next(err));
                } else {
                    for (let dish of req.body) {
                        console.log(dish);
                        Favorites.findOneAndUpdate({
                            "user": req.user._id
                        }, { $addToSet: { dishes: { _id: dish._id } } })
                            .catch((err) => next(err));
                    }
                    favorites.save()
                        .then((favorites) => {
                            console.log('Favorite Saved ', favorites);
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(favorites);
                        }, (err) => next(err))
                }
            }, (err) => next(err))
            .catch((err) => next(err));
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end('PUT operation not supported on /favorites');
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorites.remove({ "user": req.user._id })
            .then((resp) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(resp);
            }, (err) => next(err))
            .catch((err) => next(err));
    });

favoriteRouter.route('/:dishId')
    .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
    .get(cors.cors, (req, res, next) => {
        res.statusCode = 403;
        res.end('GET operation not supported on /favorites/' + req.params.dishId);
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorites.find({ "user": req.user._id })
            .then((favorites) => {
                if (favorites.length == 0) {
                    Favorites.create({
                        "user": req.user._id,
                        "dishes": [{ _id: req.params.dishId }]
                    })
                        .then((favorite) => {
                            console.log('Favorite Created ', favorite);
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(favorite);
                        }, (err) => next(err))
                        .catch((err) => next(err));
                } else if (favorites[0].dishes.filter(dishId => dishId.equals(req.params.dishId)).length == 0) {
                    Favorites.findOneAndUpdate({
                        "user": req.user._id
                    }, { $addToSet: { dishes: { _id: req.params.dishId } } })
                        .then((favorites) => {
                            console.log('Favorite Added ', favorites);
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(favorites);
                        }, (err) => next(err))
                        .catch((err) => next(err));
                } else {
                    res.statusCode = 200;
                    res.end('Dish already favorited for this user!');

                }
            }, (err) => next(err))
            .catch((err) => next(err));
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end('PUT operation not supported on /favorites/' + req.params.dishId);
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {

        Favorites.findOne({ "user": req.user._id })
            .then((favorites) => {
                if (favorites != null && favorites.dishes.length != 0) {
                    console.log(favorites);
                    favorites.dishes = favorites.dishes.filter(dishId => !dishId.equals(req.params.dishId));
                    if (favorites.dishes.length == 0) {
                        Favorites.remove({ "user": req.user._id })
                            .then((favorites) => {
                                res.statusCode = 200;
                                res.setHeader('Content-Type', 'application/json');
                                res.json(favorites);
                            }, (err) => next(err));

                    } else {
                        favorites.save()
                            .then((favorites) => {
                                res.statusCode = 200;
                                res.setHeader('Content-Type', 'application/json');
                                res.json(favorites);
                            }, (err) => next(err));
                    }
                }
                else {
                    err = new Error('Favorite Dish ' + req.params.dishId + ' not found');
                    err.status = 404;
                    return next(err);
                }
            }, (err) => next(err))
            .catch((err) => next(err));
    });

module.exports = favoriteRouter;
