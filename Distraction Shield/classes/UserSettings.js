import * as constants from '../constants'
import * as storage from '../modules/storage'

/**
 * Object holding all the data that is connected to the user's preferences.
 * Furthermore has the functionality to turn the interception part of the of extension on or off.
 * Since the current state is saved here too.
 */
export default class UserSettings {
    constructor() {
        this._status = {
            state: true,
            setAt: new Date(),
            offTill: new Date()
        };

        this._mode = constants.modes.lazy;
        this._interceptionInterval = 1;
    }

    set interceptionInterval(val) { this._interceptionInterval = val; }
    get interceptionInterval() { return this._interceptionInterval; }

    set mode(newMode) { this._mode = newMode; }
    get mode() { return this._mode; }

    set status(newStatus) { this._status = newStatus; }
    get status() { return this._status; }

    set offTill(time) { this._status.offTill = time; }
    get offTill() { return this._status.offTill; }

    get state() { return this.status.state ? "On" : "Off"; }

    isInterceptionOn() { return this.status.state; }

    /**
     * Turn the interception back on
     */
    turnOn() {
        if (this.state == "Off") {
            this.status = {state: true, setAt: new Date(), offTill: new Date()};
        } else {
            console.log("Already turned on, should not happen!");
        }
    }

    /**
     * Turn interception off. The timer variable is for deciding whether we want to initiate a javascript timeout.
     * Which will automatically turn the interception back on after it stops. This nonly happens in the background, because
     * third party pages might close while the timer runs. Which makes the turning off and on of the interception go wrong.
     * @param {boolean} timer should we set a timer, for when to turn on? (true for background, false for other (third party) page)
     */
    turnOff(timer) {
        if (this.isInterceptionOn()) {
            this.status = {state: false, setAt: new Date(), offTill: this.status.offTill};
            if (timer) {
                this.setTimer();
            }
        } else {
            console.log("Already turned off, should not happen!");
        }
    }

    turnOffFor(minutes, timer) {
        let curDate = new Date();
        this.offTill = new Date(curDate.setMinutes(minutes + curDate.getMinutes()));
        this.turnOff(timer);
    }

    turnOffForDay(timer) {
        this.offTill = new Date(new Date().setHours(24, 0, 0, 0));
        this.turnOff(timer);
    }

    turnExtensionBackOn() {
        return () => {
            if (!this.isInterceptionOn()) {
                this.turnOn();
                storage.setSettings(this);
            }
        };
    }

    setTimer() {
        let timerInMS = this.status.offTill - new Date();
        setTimeout(this.turnExtensionBackOn(), timerInMS);
    }

    reInitTimer() {
        if (!this.isInterceptionOn()) {
            if (this.offTill < new Date()) {
                this.turnOn();
                storage.setSettings(this);
            } else {
                this.setTimer();
            }
        }
    }

    /* --------------- --------------- Serialization --------------- --------------- */

    static serializeSettings(settingsObject) {
        return JSON.stringify(settingsObject);
    }

    static parseSettingsObject(parsedSettingsObject) {
        let s = new UserSettings();
        parsedSettingsObject._status.setAt = new Date(parsedSettingsObject._status.setAt);
        parsedSettingsObject._status.offTill = new Date(parsedSettingsObject._status.offTill);
        s.status = parsedSettingsObject._status;
        s.interceptionInterval = parsedSettingsObject._interceptionInterval;
        s.mode = parsedSettingsObject._mode;
        return s;
    }

    static deserializeSettings(serializedSettingsObject) {
        if (serializedSettingsObject != null) {
            let parsed = JSON.parse(serializedSettingsObject);
            return this.parseSettingsObject(parsed);
        }
        return null;
    }

}
