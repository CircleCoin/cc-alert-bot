/**
 * Module dependencies.
 */
import * as express from "express";
import * as bodyParser from "body-parser";
import * as errorHandler from "errorhandler";
import * as dotenv from "dotenv";
import * as morgan from "morgan";
import { Response, Request, NextFunction } from "express";

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
dotenv.config({ path: ".env" });

/**
 * Controllers (route handlers).
 */
import * as index from "./routes/index";

/**
 * Create Express server.
 */
const app = express();

/**
 * Express configuration.
 */
app.set("port", process.env.PORT || 8080);
app.use(morgan("dev")); // log requests to the console

// configure body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


// ROUTES FOR OUR API
// =============================================================================

// create our router
const router = express.Router();

// middleware to use for all requests
router.use(function(req: Request, res: Response, next: NextFunction) {
    // do logging
    console.log("Something is happening.");
    next();
});

app.get("/", index.index);

// // REGISTER OUR ROUTES -------------------------------
// // all of our routes will be prefixed with /api
// app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(app.get("port"), () => {
    console.log(("  App is running at http://localhost:%d in %s mode"), app.get("port"), app.get("env"));
    console.log("  Press CTRL-C to stop\n");
  });