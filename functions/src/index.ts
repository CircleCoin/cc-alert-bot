import * as requestService from "request";
import * as express from "express";
import { Request, Response } from "express";
import { format } from "path";

const functions = require("firebase-functions"); // Cloud Functions for Firebase library
const DialogflowApp = require("actions-on-google").DialogflowApp; // Google Assistant helper library

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request: Request, response: Response) => {
  console.log("Dialogflow Request headers: " + JSON.stringify(request.headers));
  console.log("Dialogflow Request body: " + JSON.stringify(request.body));

  if (request.body.queryResult) {
    processRequest(request, response);
  } else {
    console.log("Invalid Request");
    return response.status(400).end("Invalid Webhook Request (expecting v1 or v2 webhook request)");
  }
});

/*
* Function to handle v2 webhook requests from Dialogflow
*/
function processRequest(request: Request, response: Response) {
  // An action is a string used to identify what needs to be done in fulfillment
  let action = (request.body.queryResult.action) ? request.body.queryResult.action : "default";
  // Parameters are any entites that Dialogflow has extracted from the request.
  const parameters = request.body.queryResult.parameters || {}; // https://dialogflow.com/docs/actions-and-parameters
  // Contexts are objects used to track and store conversation state
  const inputContexts = request.body.queryResult.contexts; // https://dialogflow.com/docs/contexts
  // Get the request source (Google Assistant, Slack, API, etc)
  const requestSource = (request.body.originalDetectIntentRequest) ? request.body.originalDetectIntentRequest.source : undefined;
  // Get the session ID to differentiate calls from different users
  const session = (request.body.session) ? request.body.session : undefined;

  // Create handlers for Dialogflow actions as well as a 'default' handler
  const actionHandlers: any = {
    // The default welcome intent has been matched, welcome the user (https://dialogflow.com/docs/events#default_welcome_intent)
    "input.welcome": () => {
      sendResponse("Hi! My name is Cleo and I am your personal trading broker 🤓. First of all, lets get to know each other. What is your name?");
    },
    // The default fallback intent has been matched, try to recover (https://dialogflow.com/docs/intents#fallback_intents)
    "input.unknown": () => {
      // Use the Actions on Google lib to respond to Google requests; for other requests use JSON
      sendResponse("I'm having trouble, can you try that again?"); // Send simple response to user
    },
    "input.crypto-currency": () => {
      getCryptocurrencyInfo(parameters.currency);
    },
    // Default handler for unknown or undefined actions
    "default": () => {
      const responseToUser = {
        // fulfillmentMessages: richResponsesV2, // Optional, uncomment to enable
        // outputContexts: [{ 'name': `${session}/contexts/weather`, 'lifespanCount': 2, 'parameters': {'city': 'Rome'} }], // Optional, uncomment to enable
        fulfillmentText: "This is from Dialogflow's Cloud Functions for Firebase editor! :-)" // displayed response
      };
      sendResponse(responseToUser);
    }
  };

  function getCryptocurrencyInfo(currencyName: string) {
    console.log(currencyName);

    requestService.get(`https://api.coinmarketcap.com/v1/ticker/${currencyName}/?convert=EUR`)
      .on("data", function (data: string) {
        console.log(response.statusCode); // 200

        const symbol = JSON.parse(data.toString())[0].symbol;
        const percent_change_1h = formatPercent(JSON.parse(data.toString())[0].percent_change_1h);
        const change24h = formatPercent(JSON.parse(data.toString())[0].percent_change_24h);
        const price_eur: string = formatNumber(+JSON.parse(data.toString())[0].price_eur);
        const market_cap_eur: string = formatNumber(+JSON.parse(data.toString())[0].market_cap_eur, 0);

        const card = {
          "title": `#${symbol}`,
          "subtitle": `€${price_eur}\n${percent_change_1h} in 1 hour\n${change24h} in 24 hours\nMarket cap: €${market_cap_eur}\n`,
          "buttons": [
            {
              "text": "Gdax",
              "postback": "https://www.gdax.com"
            },
            {
              "text": "Bitfinex",
              "postback": "https://www.bitfinex.com/"
            }
          ]
        };

        const responseToUser = {
          fulfillmentMessages: [
            {
              "platform": "TELEGRAM",
              "card": card
            },
            {
              "platform": "FACEBOOK",
              "card": card
            },
            {
              "platform": "SLACK",
              "card": card
            }
          ]
        };

        sendResponse(responseToUser);
      })
      .on("error", function (err: Error) {
        console.log(err);
        sendResponse("Ups, something went wrong. Please try again!");
      });
  }

  function formatNumber(number: number, minimumFractionDigits?: number): string {
    return (number).toLocaleString("en-us", { minimumFractionDigits: minimumFractionDigits });
  }

  function formatPercent(percent: number): string {
    let percentFormatted: string;
    percent > 0 ? percentFormatted = `+${percent}%` : percentFormatted = `${percent}%`;
    return percentFormatted;
  }

  // If undefined or unknown action use the default handler
  if (!actionHandlers[action]) {
    action = "default";
  }

  // Run the proper handler function to handle the request from Dialogflow
  actionHandlers[action]();

  // Function to send correctly formatted responses to Dialogflow which are then sent to the user
  function sendResponse(responseToUser: any) {
    // if the response is a string send it as a response to the user
    if (typeof responseToUser === "string") {
      const responseJson = { fulfillmentText: responseToUser }; // displayed response
      response.json(responseJson); // Send response to Dialogflow
    } else {
      // If the response to the user includes rich responses or contexts send them to Dialogflow
      const responseJson: any = {};

      // Define the text response
      responseJson.fulfillmentText = responseToUser.fulfillmentText;
      // Optional: add rich messages for integrations (https://dialogflow.com/docs/rich-messages)
      if (responseToUser.fulfillmentMessages) {
        responseJson.fulfillmentMessages = responseToUser.fulfillmentMessages;
      }
      // Optional: add contexts (https://dialogflow.com/docs/contexts)
      if (responseToUser.outputContexts) {
        responseJson.outputContexts = responseToUser.outputContexts;
      }

      // Send the response to Dialogflow
      console.log("Response to Dialogflow: " + JSON.stringify(responseJson));
      response.json(responseJson);
    }
  }
}