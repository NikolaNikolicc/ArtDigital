var el;
var stepper;
// Initialize the stepper.
window.onload = function () {
  class Stepper {
    constructor(stepperElement) {
      this.stepperElement = stepperElement;
      this.events = {
        stepChanged: [],
        completed: []
      };
      this.stepsContainer = stepperElement.querySelector(".steps");
      this.steps = [...this.stepsContainer.querySelectorAll(".step")].map((step, index) => {
        return new Step(step, index, this);
      });
      this.buttons = stepperElement.querySelector(".buttons");
      this.next = new NextButton(this.buttons.querySelector(".step-next"), this);
      this.back = new BackButton(this.buttons.querySelector(".step-back"), this);
      this.complete = new CompleteButton(this.buttons.querySelector(".step-complete"), this);
      this.finish = new FinishButton(this.buttons.querySelector(".step-finish"), this);
      this.setActiveStep(0);
      this.buttons.querySelector(".step-complete").focus();
    }

    nextStep() {
      this.setActiveStep(this.activeIndex + 1);

    }

    previousStep() {
      this.setActiveStep(this.activeIndex - 1);
    }

    // Add event listners to event object.
    listenForEvent(eventName, callback) {
      this.events[eventName].push(callback);
    }

    // @returns {boolean} True if all steps are complete.
    get isComplete() {
      return this.steps.filter(step => step.isComplete).length === this.steps.length;
    }

    // Runs all callbacks under the specified event key.
    emmitEvent(eventName) {
      this.events[eventName].forEach(callback => {
        callback(this);
      });
    }

    /**
     * This is the main function for setting the active step. This also emmits all
     * Event listners for children classes.
     */
    setActiveStep = index => {
      if (parseInt(index) == 0) {
        return;
      }
      if (parseInt(index) == 1 || parseInt(index) == 2 || parseInt(index) == 3) {
        console.log("index", index);
        var type = getTypes()
        console.log("types", type);
        if (type !== null) {
          if (type == 1) {
            return showPopup("Molimo vas da dodate fotografije");
          }
          return showPopup("Molimo vas da dodate fotografije za " + type['name']);
        }
        if (!canSend()) {
          return showPopup("Molimo vas da sacekate da se fotografije ucitaju");
        }
      }

      if (parseInt(index) >= 2) {
        if (!canSend()) {
          return showPopup("Molimo vas da sacekate da se fotografije ucitaju");
        }
        try {
          if (jQuery('#da_akcija').is(':checked')) {
            var s = document.getElementsByClassName('slot');
            for (var i = 0; i < s.length; i++) {
              console.log('src', s[i].getElementsByTagName('img')[0]);
              if (!s[i].getElementsByTagName('img')[0].src) {
                return showPopup("Molimo vas da dodate fotografije za " + slots_data[i % slots_data.length]['name']);
              }
            }
          }
        } catch (e) {}
      }
      jQuery('.step-next').css('display', 'block');
      // Only run if actually changing the current step.
      if (this.activeIndex !== index) {
        // Change to specific index only if within steps range.
        if (index > -1 && index < this.steps.length) {
          this.activeIndex = index;
          // If not in range then default to first step.
        } else {
          this.activeIndex = 0;
        }
        this.emmitEvent("stepChanged");
        if (this.isComplete) this.emmitEvent("completed");
      }
      var root = document.getElementById('root');
      var pages = root.getElementsByClassName('page');
      for (var i = 0; i < pages.length; i++) {
        pages[i].style.display = 'none';
      }
      if (parseInt(this.activeIndex) == 2) {
        if (!canSend()) {
          return showPopup("Molimo vas da sacekate da se fotografije ucitaju");
        }
        findPrice();
      }
      if (parseInt(this.activeIndex) == 2) {
        if (!jQuery('#shipping1').is(':checked')) {
          jQuery('#if_dostava').text('+ Dostava (399 RSD)');
        } else {
          jQuery('#if_dostava').text('');
        }
      }
      document.getElementById('slide' + (parseInt(this.activeIndex) + 1)).style.display = 'flex';

      if (parseInt(this.activeIndex) == 3){
        findPrice();
        jQuery('.step-next').css('display', 'none');
      } else {
        jQuery('.step-next').css('display', 'block');
      }

      if (parseInt(this.activeIndex) >= 1) {
        jQuery('.dodaj-slike').css('display', 'none');
      } else {
        jQuery('.dodaj-slike').css('display', 'block');
      }
      // jQuery('.page').hide();
      // jQuery('#slide' + (parseInt(this.activeIndex)+1)).show();
    };
  }

  /**
   * Each step get's it's own logic and functionality. This will listen for
   * changes made to the current active step.
   *
   * It will update it's UI when it is: focused, blured, or completed.
   *
   * On init and reset() it set's its icon element to it's proper index.
   *
   * @author Robert Todar <robert@roberttodar.com>
   */
  function getTypes() {
    var types = {};
    var data = document.getElementById('images').getElementsByClassName('browser-default');
    for (var i = 0; i < data.length; i++) {
      var type = data[i].value;
      if (type in types) {
        types[type]++;
      } else {
        types[type] = 1;
      }
    }
    console.log("types", types)
    if (Object.keys(types).length == 0) {
      return 1;
    }

    // if (document.getElementById('sve_akcija').checked) {
    //   if (types['A3 Akcija'] > 0) {
    //     return true;
    //   } else {
    //     return false;
    //   }
    // }

    // Akcijeeee
    // if (document.getElementById('all_akcija').checked) {
    //   if (!types['A3 Akcija'] || types['A3 Akcija'] < 1) {
    //     return "Poster";
    //   } else if (!types['Privezak'] || types['Privezak'] < 2) {
    //     return "Privezak";
    //   } else if (!types['Magnet'] || types['Magnet'] < 1) {
    //     return "Magnet";
    //   } else if (!types['Iznenadjenje'] || types['Iznenadjenje'] < 1) {
    //     return "Iznenadjenje";
    //   } else {
    //     return null;
    //   }
    // }

    // if (document.getElementById('privezak_album_akcija').checked) {
    //   if (types['Privezak'] > 1) {
    //     return true;
    //   } else {
    //     return false;
    //   }
    // }

    // if (document.getElementById('magnet_album_akcija').checked) {
    //   if (types['Magnet'] > 0) {
    //     return true;
    //   } else {
    //     return false;
    //   }
    // }

    return null;
  }
  class Step {
    constructor(step, index, stepper) {
      this.step = step;
      this.index = index;
      this.stepper = stepper;
      this.icon = step.querySelector(".icon");
      this.isComplete = false;
      this.isActive = false;
      stepper.listenForEvent("stepChanged", this.stepChanged);
      this.mouseEvent = this.step.addEventListener("mouseup", () => {
        this.stepper.setActiveStep(this.index);
      });
      this.reset();
    }

    // Event - sees if UI should be updated from getting or loosing focus.
    stepChanged = ({
      activeIndex
    }) => {
      if (activeIndex === this.index) {
        this.setFocus();
      } else {
        this.looseFocus();
      }
    };

    setFocus() {
      if (!this.isActive) {
        this.step.classList.add("active");
        this.isActive = true;
      }
    }

    looseFocus() {
      if (this.isActive) {
        this.step.classList.remove("active");
        this.isActive = false;
      }
    }

    complete() {
      this.isComplete = true;
      this.icon.innerHTML = '<i class="material-icons">done</i>';
    }

    reset() {
      this.isComplete = false;
      this.icon.innerHTML = this.index + 1;
    }
  }

  /**
   * This is a generic Button class meant to be extended to all the other
   * buttons.
   *
   * It really just updates the UI from being disabled|enabled and displayed.
   *
   * @note I can't figure out how to have this.stepper.listenForEvent("stepChanged", this.stepChanged);
   *  within this class??
   */
  class Button {
    constructor(el, stepper) {
      this.stepper = stepper;
      this.el = el;
      this.el.addEventListener("click", this.mouseup);
    }

    disable() {
      this.el.disabled = true;
    }

    enable() {
      this.el.disabled = false;
    }

    hide() {
      this.el.style.display = "none";
    }

    show() {
      this.el.style.display = "inline-block";
    }
  }

  /**
   * Next button moves the active step forward.
   * It is disabled if at the end of the steps.
   */
  class NextButton extends Button {
    constructor(el, stepper) {
      super(el, stepper);
      this.stepper.listenForEvent("stepChanged", this.stepChanged);
    }

    mouseup() {
      const {
        setActiveStep,
        activeIndex
      } = stepper;
      setActiveStep(activeIndex + 1);
    }

    stepChanged = ({
      activeIndex,
      steps
    }) => {
      if (activeIndex === steps.length - 1) this.disable();
      if (activeIndex < steps.length - 1) this.enable();
    };
  }

  /**
   * Back button moves the active step backward.
   * It is disabled if at the start of the steps.
   */
  class BackButton extends Button {
    constructor(el, stepper) {
      super(el, stepper);
      this.stepper.listenForEvent("stepChanged", this.stepChanged);
    }

    mouseup() {
      const {
        setActiveStep,
        activeIndex
      } = stepper;
      setActiveStep(activeIndex - 1);
    }

    stepChanged = ({
      activeIndex
    }) => {
      if (activeIndex === 0) this.disable();
      if (activeIndex > 0) this.enable();
    };
  }

  /**
   * Complete button calls to replace the active step index with a checkmark icon.
   * It is disabled if current step is complete already.
   * Is also hidden once all steps are complete.
   */
  class CompleteButton extends Button {
    constructor(el, stepper) {
      super(el, stepper);
      this.stepper.listenForEvent("stepChanged", this.stepChanged);
      this.stepper.listenForEvent("completed", this.completed);
    }

    mouseup() {
      const {
        setActiveStep,
        activeIndex,
        steps
      } = stepper;
      steps[activeIndex].complete();
      setActiveStep(activeIndex + 1);
    }

    stepChanged = ({
      steps,
      activeIndex
    }) => {
      if (steps[activeIndex].isComplete) {
        this.disable();
      } else {
        this.enable();
      }
    };

    completed = () => {
      this.hide();
    };
  }

  /**
   * Finish button currently just resets everything back to normal.
   * It is hidden by default and shown once all steps are complete.
   */
  class FinishButton extends Button {
    constructor(el, stepper) {
      super(el, stepper);
      this.stepper.listenForEvent("completed", this.completed);
    }

    mouseup() {
      const {
        setActiveStep,
        steps,
        complete,
        finish
      } = stepper;
      steps.forEach(step => {
        step.reset();
      });
      finish.hide();
      complete.show();
      complete.enable();
      setActiveStep(0);
    }

    completed = () => {
      this.show();
      this.el.focus();
    };
  }
  el = document.querySelector(".stepper");
  stepper = new Stepper(el);
}