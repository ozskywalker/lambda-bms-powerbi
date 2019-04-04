'use strict';

const rp = require('request-promise');
const _ = require('lodash');

const BMS_API_USERNAME = process.env.BMS_API_USERNAME;
const BMS_API_PASSWORD = process.env.BMS_API_PASSWORD;
const BMS_API_SERVER = process.env.BMS_API_SERVER ? process.env.BMS_API_SERVER : 'https://bms.kaseya.com'
const BMS_API_TENANT = process.env.BMS_API_TENANT;
const BMS_API_TOP = process.env.BMS_API_TOP ? process.env.BMS_API_TOP : "15";
const POWERBI_API = process.env.POWERBI_API;

global.access_token = '';

function web_call(method, url, payload) {
  return new Promise(function (resolve, reject) {
    const opt = {
      method: method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + access_token
      },
      json: true
    }

    // ugh this is utter shite
    if (url.indexOf("https") != 0) {
      Object.assign(opt, { uri: BMS_API_SERVER + url });
    } else {
      Object.assign(opt, { uri: url });
    }

    if (url.indexOf("/api/token" >= 0)) {
      Object.assign(opt, { form: payload });
    } else {
      Object.assign(opt, { body: payload });
    }

    if (access_token == '') { 
      delete opt.headers['Content-Type'];
      delete opt.headers['Authorization'];
    }

    console.log('web_call(): calling ' + opt.uri);

    rp(opt).then(function (res) {
      resolve(res);
    }).catch(function (err) {
      console.log('web_call(): FAIL: ', err);
      reject(err);
    })
  });
}

function login() {
  return new Promise(function (resolve, reject) {
    const login_Promise = web_call(
      "POST",
      "/api/token",
      {
        username: BMS_API_USERNAME,
        password: BMS_API_PASSWORD,
        grant_type: "password",
        tenant: BMS_API_TENANT
      }
    );

    login_Promise.then(function (res) {
      access_token = res.access_token;
      console.log('login(): access token received -> ', access_token);
      resolve(access_token);
    }).catch(function (err) {
      console.log('login(): FAIL: ', err);
      reject(false);
    })
  });
}

function getTickets() {
  return new Promise(function (resolve, reject) {
    const getTicket_Promise = web_call(
      "GET",
      "/api/servicedesk/tickets?$orderby=Id desc&$top=" + BMS_API_TOP,
      {}
    );

    getTicket_Promise.then(function (res) {
      var ticket_payload = res;
      console.log('getTickets(): received payload, no. of results: ', ticket_payload.TotalRecords);

      var reduced_payload = _.map(ticket_payload.Result, function(object) {
        return _.pick(object, ['AccountName', 'DueDate', 'LastActivityUpdate', 'OpenDate', 'Queue', 'Status', 'TicketNumber', 'Title']);
      });

      var ticketPromises = [];

      _.forEach(reduced_payload, function(v) {
        var opt = {
          method: POST,
          uri: POWERBI_API,
          body: v,
          json: true
        }

        ticketPromises.push(
          rp(opt)
            .then(function(res) {
              console.log(`${v.TicketNumber}: ${res.statusCode}`);
              resolve('Success');
          })
        );
      });

      Promise.all(ticketPromises).then(function() {
        console.log("getTickets(): all promises should have triggered...");
        resolve();
      });
    }).catch(function (err) {
        console.log('getTickets(): sendToPowerBI(): FAIL: ', err);
        reject(false);
    })
  });
}

module.exports.getBMStickets = async (event) => {
  return new Promise((resolve) => {
    console.log('getBMStickets: triggered');

    login()
    .then((token) => {
      access_token = token;

      getTickets()
      .then((res) => {
        console.log("ticket work done");

        resolve({
          statusCode: 200,
          body: JSON.stringify({
            message: 'job complete'
          })
        });
      })
    })
  });
};
