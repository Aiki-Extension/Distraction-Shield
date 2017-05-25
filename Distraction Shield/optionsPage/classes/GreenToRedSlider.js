//import * as $ from "../../dependencies/jquery/jquery-1.10.2";
import * as constants from "../../constants"


export default class GreenToRedSlider {


    constructor(sliderID, saveFunction) {
        this.alert = chrome.extension.getBackgroundPage().alert;
        this.saveValue = saveFunction;
        this.sliderDiv = $(sliderID);
        this.sliderRange = $(this.sliderDiv.find(sliderID + "-range"));
        this.sliderValue = $(this.sliderDiv.find(sliderID + "-value"));

        this.sliderRange.on('input', () => {
            let inputValue = this.sliderRange.val();
            this.sliderValue.html(GreenToRedSlider.calculateHours(inputValue));
            this.updateColor(inputValue);
        });

        this.sliderRange.on('mouseup', () => {
            let inputValue = this.sliderRange.val();
            this.saveValue(inputValue);
        });

        this.sliderValue.on('blur', () => {
            this.checkTimeValidity(this.sliderValue.html());
        });

        this.sliderValue.keydown( event => {
            if (event.keyCode === constants.KEY_ENTER) {
                this.sliderValue.blur();
                event.preventDefault();
            }
        });
    }

    updateColor(inputValue) {
        let maxSliderVal = (this.sliderRange[0]).max;
        let redVal = Math.round(inputValue / maxSliderVal * 120);
        let greenVal = 120 - redVal;
        this.sliderRange.css('background', 'rgb(' + redVal + ', ' + greenVal + ',0)');
    }

    setValue(val) {
        this.sliderRange.val(val);
        this.sliderValue.html(GreenToRedSlider.calculateHours(val));
        this.updateColor(val);
    }

    static calculateHours(val) {
        let hours = Math.floor(val / 60);
        let minutes = val % 60;
        if (minutes < 10 && hours > 0) {
            minutes = "0" + minutes;
        }
        return (hours > 0 ? hours + ":" + minutes + " hours" : minutes + " minute(s)");
    }

    checkTimeValidity(val) {
        let regex = (/(\d+|\d\:\d{2})(?:\s*)(h(?:our)?s?|m(?:inute|in)?s?|$)/m).exec(val);
        if (regex !== null) {
            if (regex[1].match(":")) {
                let split = regex[1].split(":");
                regex[1] = parseInt(split[0]) + parseInt(split[1]) / 60;
            }
            if (regex[1] > 0) {
                if (regex[2].match("hour")) {
                    regex[1] *= 60;
                }
                // round minutes to a valid number.
                regex[1] = Math.round(regex[1]);
                this.setValue(this.sliderRange[0].max < regex[1] ? this.sliderRange[0].max : regex[1]);
            } else {
                this.timeInputError();
            }
        } else {
            this.timeInputError();
        }
    }

    timeInputError() {
        this.setValue(this.sliderRange.val());
        this.alert("please input a supported time format");
    }
}