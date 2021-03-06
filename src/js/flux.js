"use strict";

var Fluxxor = require("fluxxor");

var constants = {
  ADD_FORM_ELEMENT: "ADD_FORM_ELEMENT",
  UPDATE_FORM_ELEMENT: "UPDATE_FORM_ELEMENT",
  REORDER_FORM_ELEMENTS: "REORDER_FORM_ELEMENTS",
  DELETE_FORM_ELEMENT: "DELETE_FORM_ELEMENT",
  SET_EDITOR_VISIBILITY: "SET_EDITOR_VISIBILITY",
  SET_INITIAL_DATA: "SET_INITIAL_DATA",
  UPDATE_FORM_METADATA: "UPDATE_FORM_METADATA",
  UPDATE_VIEWER_FIELD: "UPDATE_VIEWER_FIELD",
  UPDATE_FORM_STATUS: "UPDATE_FORM_STATUS",
  SET_FORM_ID: "SET_FORM_ID"
};


var FormElementStore = Fluxxor.createStore({
  initialize: function() {
    this.elements = [];
    this.record = {};
    this.metadata = {};
    this.formId = null;
    this.metadata.editStatus = {
      "title": false,
      "description": false,
      "submit": false
    };

    // XXX. Make this evolve, it's a pain.
    this.bindActions(
      constants.ADD_FORM_ELEMENT, this.onAdd,
      constants.UPDATE_FORM_ELEMENT, this.onUpdate,
      constants.REORDER_FORM_ELEMENTS, this.reorderFormElements,
      constants.DELETE_FORM_ELEMENT, this.onDelete,
      constants.SET_EDITOR_VISIBILITY, this.setEditorVisibility,
      constants.SET_INITIAL_DATA, this.setInitialData,
      constants.UPDATE_FORM_METADATA, this.updateFormMetadata,
      constants.UPDATE_VIEWER_FIELD, this.updateViewerField,
      constants.UPDATE_FORM_STATUS, this.updateFormStatus,
      constants.SET_FORM_ID, this.setFormId
    );
  },

  setInitialData: function(payload) {
    this.formStatus = "saved";
    if (payload === undefined) {
      payload = {
        metadata: {
          formName: 'Form title',
          formDescription: 'A paragraph describing your form.',
          submitButtonLabel: 'Submit'
        },
        formElements: []
      };
      this.formStatus = "new";
    }
    this.metadata = payload.metadata;
    this.metadata.editStatus = {
      "title": false,
      "description": false,
      "submit": false
    };
    this.elements = payload.formElements;
    this.record = {};

    // The elements in react need to all have an id.
    this.elements.forEach(function(element, id) {
      element.id = id;
    });
    this.emit("change");
  },

  updateFormMetadata: function(payload) {
    this.metadata[payload.name] = payload.label;
    this.emit("change");
  },

  updateFormStatus: function(status) {
    this.formStatus = status;
    this.emit("change");
  },

  onAdd: function(payload){
    this.elements.push({
      id: this.elements.length,
      fieldType: payload.fieldType,
      data: payload.defaultData
    });
    this.formStatus = "new";
    this.emit("change");
  },

  onUpdate: function(payload) {
    var element = this.elements.filter(function(el) {
      return el.id === payload.element.id;
    })[0];

    var index = this.elements.indexOf(element);
    this.elements[index] = payload.element;
    this.emit("change");
  },

  // The payload contains an elementsOrder array property
  // with the list of elements ids in the new order.
  reorderFormElements: function(payload) {
    var elements = [];
    payload.elementsOrder.forEach(function(id) {
      var element = this.elements.filter(function(el) {
        return el.id === parseInt(id, 10);
      })[0];
      elements.push(element);
    }.bind(this));
    this.elements = elements;
    this.emit("change");
  },

  onDelete: function(id) {
    this.elements = this.elements.filter(function(el) {
      return el.id !== id;
    });
    this.emit("change");
  },

  // The payload contains the element id and the isVisible state.
  setEditorVisibility: function(payload) {
    Object.keys(this.metadata.editStatus).forEach(function(key) {
      if (key === payload.id) {
        this.metadata.editStatus[payload.id] = payload.isVisible;
      } else {
        this.metadata.editStatus[key] = false;
      }
    }.bind(this));
    this.elements = this.elements.map(function(el) {
      if (el.id === payload.id) {
        el.currentlyEdited = payload.isVisible;
      } else {
        el.currentlyEdited = false;
      }
      return el;
    });
    this.emit("change");
  },

  updateViewerField: function(payload) {
    this.record[payload.name] = payload.value;
    this.emit("change");
  },

  setFormId: function(formId) {
    this.formId = formId;
    // We don't emit here onpurpose.
  },

  getState: function() {
    return {
      formElements: this.elements,
      metadata: this.metadata,
      record: this.record,
      formStatus: this.formStatus
    };
  }
});

var actions = {
  addFormElement: function(fieldType, defaultData) {
    this.dispatch(constants.ADD_FORM_ELEMENT, {
      fieldType: fieldType,
      defaultData: defaultData
    });
  },
  updateFormElement: function(element) {
    this.dispatch(constants.UPDATE_FORM_ELEMENT, {element: element});
  },
  reorderFormElements: function(elementsOrder) {
    this.dispatch(constants.REORDER_FORM_ELEMENTS, {elementsOrder: elementsOrder});
  },
  deleteFormElement: function(id) {
    this.dispatch(constants.DELETE_FORM_ELEMENT, id);
  },
  setEditorVisibility: function(id, isVisible) {
    this.dispatch(constants.SET_EDITOR_VISIBILITY, {
      id: id,
      isVisible: isVisible
    });
  },
  setInitialData: function(data) {
    this.dispatch(constants.SET_INITIAL_DATA, data);
  },
  updateFormMetadata: function(name, label) {
    this.dispatch(constants.UPDATE_FORM_METADATA, {
      name: name,
      label: label
    });
  },
  updateViewerField: function(name, value) {
    this.dispatch(constants.UPDATE_VIEWER_FIELD, {
      name: name,
      value: value
    });
  },
  updateFormStatus: function(status) {
    this.dispatch(constants.UPDATE_FORM_STATUS, status);
  },
  setFormId: function(formId) {
    this.dispatch(constants.SET_FORM_ID, formId);
  }
};

var stores = {
  FieldElementsStore: new FormElementStore()
};

var flux = new Fluxxor.Flux(stores, actions);

module.exports = {
  flux: flux,
  actions: actions
};
