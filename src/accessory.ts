import {
  AccessoryConfig,
  AccessoryPlugin,
  API,
  HAP,
  Logging,
  Service,
} from 'homebridge';
import fetch from 'node-fetch';

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
let hap: HAP;

/*
 * Initializer function called when the plugin is loaded.
 */
export = (api: API) => {
  hap = api.hap;
  api.registerAccessory('EnphaseBatteryGridControlHomebridgePlugin', EnphaseBatteryGridControl);
};

// Request URL: https://enlighten.enphaseenergy.com/pv/systems/3419276/today

const authPArams = new URLSearchParams();
authPArams.append('redirect_uri', 'https://api.enphaseenergy.com/oauth/redirect_uri');

class EnphaseBatteryGridControl implements AccessoryPlugin {

  private readonly log: Logging;
  private readonly config: AccessoryConfig;
  private readonly name: string;
  private readonly siteId: string;
  private readonly gridChargingTime: string;
  private readonly APIKey: string;
  private readonly authURL: string;
  private readonly authCode: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly batteryService: Service;
  private readonly informationService: Service;
  private authToken: string;
  private authRefreshToken: string;

  private cookie;

  constructor(log: Logging, config: AccessoryConfig) {
    this.log = log;
    this.config = config;
    this.name = config.name;
    this.siteId = config.siteId;
    this.gridChargingTime = config.gridChargingTime;
    this.APIKey = config.APIKey;
    this.authURL = config.authURL;
    this.authCode = config.authCode;
    authPArams.append('code', `${encodeURIComponent(config.authCode)}`);
    this.authenticate();

    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.siteId = config.siteId;

    this.batteryService = new hap.Service.Switch(this.name + ' Grid Charging');
    this.batteryService.getCharacteristic(hap.Characteristic.On)
      .onGet(async () => {
        return await this.getGridChargingStatus();
      })
      .onSet(async (state) => {
        this.setGridChargingStatus;
      });

    this.informationService = new hap.Service.AccessoryInformation()
      .setCharacteristic(hap.Characteristic.Manufacturer, 'Enphase')
      .setCharacteristic(hap.Characteristic.SerialNumber, config.siteId);
  }

  /*
     * This method is called directly after creation of this instance.
     * It should return all services which should be added to the accessory.
     */
  getServices(): Service[] {
    return [
      this.informationService,
      this.batteryService,
    ];
  }

  // Users clientid, clientsecret, authcode, and authuri to get initial token and refresh token
  async getToken(){
    authPArams.append('grant_type', 'authorization_code');

    return fetch('https://api.enphaseenergy.com/oauth/token', {
      method: 'post',
      body: authPArams,
      headers: {'Authorization': `Basic ${Buffer.from(this.config.clientId+':'+this.config.clientSecret).toString('base64')}`},
    });
  }

  async refreshToken(){
    authPArams.append('grant_type', 'refresh_token');
    authPArams.append('refresh_token', this.authRefreshToken);

    return fetch('https://api.enphaseenergy.com/oauth/token', {
      method: 'post',
      body: authPArams,
      headers: {'Authorization': `Basic ${Buffer.from(this.config.clientId+':'+this.config.clientSecret).toString('base64')}`},
    });
  }




  // https://enlighten.enphaseenergy.com/login/login
  async authenticate() {

    //if bearer token is nil
    if (this.authToken == ''){
      const authResponse = await this.getToken()
        .then(authResponse => authResponse.json)
        .then(authResponse => {
          this.authToken = authResponse.access_token;
          this.authRefreshToken = authResponse.refresh_token;
          return true;
        })
        .catch(error => {
          console.error(error);
        });
    }

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
  async getGridChargingStatus() {

  }

  // PUT /api/v4/systems/config/{system_id}/battery_settings
  // {
  // "battery_mode": "string",
  // "reserve_soc": 0,
  // "energy_independence": "string"
  // }
  async setGridChargingStatus() {

  }
}
