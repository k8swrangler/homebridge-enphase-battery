
import fetch from 'node-fetch';
import { URLSearchParams } from 'url';

/*
 * IMPORTANT NOTICE
 *
 * One thing you need to take care of is, that you never ever ever import anything directly from the "homebridge" module
 * (or the "hap-nodejs" module).
 * The above import block may seem like, that we do exactly that, but actually those imports are only used for types and interfaces
 * and will disappear once the code is compiled to Javascript.
 * In fact you can check that by running `npm run build` and opening the compiled Javascript file in the `dist` folder.
 * You will notice that the file does not contain a `... = require("homebridge");` statement anywhere in the code.
 *
 * The contents of the above import statement MUST ONLY be used for type annotation or accessing things like CONST ENUMS,
 * which is a special case as they get replaced by the actual value and do not remain as a reference in the compiled code.
 * Meaning normal enums are bad, const enums can be used.
 *
 * You MUST NOT import anything else which remains as a reference in the code, as this will result in
 * a `... = require("homebridge");` to be compiled into the final Javascript code.
 * This typically leads to unexpected behavior at runtime, as in many cases it won't be able to find the module
 * or will import another instance of homebridge causing collisions.
 *
 * To mitigate this the {@link API | Homebridge API} exposes the whole suite of HAP-NodeJS inside the `hap` property
 * of the api object, which can be acquired for example in the initializer function. This reference can be stored
 * like this for example and used to access all exported variables and classes from HAP-NodeJS.
 */

/*
 * Initializer function called when the plugin is loaded.
 */


// Request URL: https://enlighten.enphaseenergy.com/pv/systems/3419276/today

const authPArams = new URLSearchParams();
authPArams.append('redirect_uri', 'https://api.enphaseenergy.com/oauth/redirect_uri');

class EnphaseBatteryGridControl {

  private readonly config: Record<string, any>;
  private readonly name: string;
  private readonly siteId: string;
  private readonly gridChargingTime: any;
  private readonly apiKey: string;
  //   private readonly authURL: string;
  private readonly authCode: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  authToken: string;
  authRefreshToken: string;

  private cookie;

  constructor() {
    this.config = config;
    this.name = config.name;
    this.siteId = config.siteId;
    this.gridChargingTime = config.gridChargingTime;
    this.apiKey = config.apiKey;
    // this.authURL = config.authURL;
    this.authCode = config.authCode;
    authPArams.append('code', `${encodeURIComponent(config.authCode)}`);
    this.authToken = '';
    this.authRefreshToken = '';
    this.authenticate();

    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.siteId = config.siteId;
  }


  // Users clientid, clientsecret, authcode, and authuri to get initial token and refresh token
  async getToken(){
    authPArams.append('grant_type', 'authorization_code');

    const test = await fetch('https://api.enphaseenergy.com/oauth/token?' +authPArams, {
      method: 'post',
      //   body: 'redirect_uri=https://api.enphaseenergy.com/oauth/redirect_uri',
      //   body: authPArams,
      headers: {
        'Authorization': `Basic ${Buffer.from(this.config.clientId+':'+this.config.clientSecret).toString('base64')}`,
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    console.log(`Basic ${Buffer.from(this.config.clientId+':'+this.config.clientSecret).toString('base64')}`);
    console.log(authPArams);
    console.log(test);

    return test;
  }

  async refreshToken(){
    authPArams.append('grant_type', 'refresh_token');
    authPArams.append('refresh_token', this.authRefreshToken);

    return await fetch('https://api.enphaseenergy.com/oauth/token', {
      method: 'post',
      body: authPArams,
      headers: {'Authorization': `Basic ${Buffer.from(this.config.clientId+':'+this.config.clientSecret).toString('base64')}`},
    });
  }




  // https://enlighten.enphaseenergy.com/login/login
  async authenticate() {

    //if bearer token is nil
    if (this.authToken == ''){
      console.log('empty token');
      const authResponse = await this.getToken()
        .then(authResponse => authResponse.json)
        .then(authResponse => {
          console.log('gotauthresponse');
          console.log(authResponse.content);
          this.authToken = authResponse.access_token;
          this.authRefreshToken = authResponse.refresh_token;
          return true;
        })
        .catch(error => {
          console.error(error);
        });
    }

    console.log(this.authToken);
    // bearer is not nil then do the thing and if that fails for token exired, then refresh token

    return fetch(`https://api.enphaseenergy.com/api/v4/systems/{system_id}/summary?key=${encodeURIComponent(this.config.APIKey)}`, {
      header: `Authorization: ${this.authToken}`,
    })
      .then()
      .catch(error => {
      // console.error(error); //Refresh token if error is status is not 200
      });
  }


  // GET /api/v4/systems/config/{system_id}/battery_settings
  // {
  //   "system_id": 1765,
  //   "battery_mode": "Self - Consumption",
  //   "reserve_soc": 95,
  //   "energy_independence": "enabled",
  //   "charge_from_grid": "disabled",
  //   "battery_shutdown_level": 13
  // }
  //   async getGridChargingStatus() {

  //   }

  //   // PUT /api/v4/systems/config/{system_id}/battery_settings
  //   // {
  //   // "battery_mode": "string",
  //   // "reserve_soc": 0,
  //   // "energy_independence": "string"
  //   // }
  //   async setGridChargingStatus() {

//   }
}


const battery: EnphaseBatteryGridControl = new EnphaseBatteryGridControl();


