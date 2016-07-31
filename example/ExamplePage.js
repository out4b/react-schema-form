/**
 * Created by steve on 12/09/15.
 */
'use strict';

var React = require('react');
var utils = require('../src/utils');
var SchemaForm = require('../src/SchemaForm');
require('react-select/less/select.less');
var Select = require('react-select');
var $ = require('jquery');
import AceEditor from 'react-ace';
require('brace/ext/language_tools');
require('brace/mode/json');
require('brace/theme/github');
require('rc-select/assets/index.css');
import RcSelect from 'react-schema-form-rc-select/lib/RcSelect';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';

import getMuiTheme from 'material-ui/styles/getMuiTheme';
import lightRawTheme from 'material-ui/styles/baseThemes/lightBaseTheme';

var ExamplePage = React.createClass({

    childContextTypes: {
        muiTheme: React.PropTypes.object
    },

    getChildContext() {
        return {
            muiTheme: this.state.muiTheme
        };
    },

    getInitialState: function() {
        return {
            tests: [
                // { label: "Simple", value: 'data/simple.json' },
                // { label: "Simple Array", value: 'data/simplearray.json'},
                // { label: "Basic JSON Schema Type", value: 'data/types.json' },
                // { label: 'Basic Radios', value: 'data/radio.json'},
                // { label: 'Condition', value: 'data/condition.json'},
                // { label: "Kitchen Sink", value: 'data/kitchenSink.json'},
                // { label: "Login", value: 'data/login.json'},
                // { label: "Date", value: 'data/date.json'},
                // { label: "Readonly", value: 'data/readonly.json'},
                // { label: "Array", value: 'data/array.json'},
                // { label: "Object", value: 'data/object.json'},
                // { label: "ArraySelect", value: 'data/arrayselect.json'}
            ],
            validationResult: {},
            schema: {},
            form: [],
            model: {},
            schemaJson: '',
            formJson: '',
            selected: '',
            muiTheme: getMuiTheme(lightRawTheme),
            deviceInfo: {},
            apis: [],
            outputSchema: {type: "object"},
            outputForm: [],
            outputModel: {},
            serverAddr: 'http://localhost:3049'
        };
    },

    onSelectChange: function(val) {
        var _this = this;

        var deviceInfo = this.state.deviceInfo;
        var deviceID = val.value;
        var spec = deviceInfo[deviceID];
        var serviceList = spec.device.serviceList;
        var sl = Object.keys(serviceList);
        var deviceAPIs = [];
        sl.forEach(function(serviceID) {
            var service = serviceList[serviceID];
            var al = Object.keys(service.actionList);
            al.forEach(function(actionName) {
                deviceAPIs.push(
                    <div>
                        <RaisedButton primary={true} label={actionName} onTouchTap={_this.onShowAPI.bind(null, deviceID, serviceID, actionName)}/>
                    </div>
                );
            });
        });
        this.setState({apis: deviceAPIs, model: {}, selected: val.value});

        return;
        // }

        // $.ajax({
        //     type: 'GET',
        //     url: val.value
        // }).done(function(data) {
        //     //console.log('done', data);
        //     //console.log('data.schema = ', data.schema);
        //     //console.log('data.form = ', data.form);
        //     this.setState({
        //         schemaJson: JSON.stringify(data.schema, undefined, 2),
        //         formJson: JSON.stringify(data.form, undefined, 2),
        //         selected : val.value,
        //         schema: data.schema,
        //         model: {},
        //         form: data.form
        //     });
        // }.bind(this));
    },

    onModelChange: function(key, val) {
        var newModel = this.state.model;
        utils.selectOrSet(key, newModel, val);
        this.setState({ model: newModel });
    },

    onOutputModelChange: function(key, val) {
        console.log('ExamplePage.onOutputModelChange:', key, val);
    },

    onValidate: function() {
        let result = utils.validateBySchema(this.state.schema, this.state.model);
        this.setState({ validationResult: result });
    },

    onShowAPI: function(deviceID, serviceID, actionName) {
        var _this = this;
        var spec = this.state.deviceInfo[deviceID];
        var argumentList  = spec.device.serviceList[serviceID].actionList[actionName].argumentList;
        var stateVarTable = spec.device.serviceList[serviceID].serviceStateTable;
        this.setState({argumentList: argumentList});
        // for demo simplicity only support one argument for now
        for (var name in argumentList) {
            var arg = argumentList[name];
            if (arg.direction === 'in') {
                var stateVarName = arg.relatedStateVariable;
                var stateVar = stateVarTable[stateVarName];
                if (stateVar.dataType === 'object') {
                    var schema = stateVar.schema;
                    $.ajax({
                        type: 'GET',
                        url: _this.state.serverAddr + '/device-control/' + deviceID + '/schema/' + schema
                    }).done(function(schemaObject) {
                        console.log(schemaObject);
                        _this.setState({schemaJson: JSON.stringify(schemaObject), schema: schemaObject});
                        var f = ["*"];
                        _this.setState({formJson: JSON.stringify(f), form: f});
                    });
                }
            } else {
                var stateVarName = arg.relatedStateVariable;
                var stateVar = stateVarTable[stateVarName];
                if (stateVar.dataType === 'object') {
                    var schema = stateVar.schema;
                    $.ajax({
                        type: 'GET',
                        url: _this.state.serverAddr + '/device-control/' + deviceID + '/schema/' + schema
                    }).done(function(schemaObject) {
                        _this.setState({outputSchema: schemaObject});
                    });
                }
            }
        }
        this.setState({deviceID: deviceID, serviceID: serviceID, actionName: actionName});
    },

    onFormChange: function(val) {
        try {
            let f = JSON.parse(val);
            this.setState({formJson: val, form: f});
        } catch (e) {}
    },

    onSchemaChange: function(val) {
        try {
            let s = JSON.parse(val);
            this.setState({schemaJson: val, schema: s});
        } catch (e) {}
    },

    onServerAddrChange: function(key, val) {
        this.setState({ serverAddr: val });
    },

    onConnectServer: function() {
        var _this = this;

        $.ajax({
            type: 'GET',
            url: _this.state.serverAddr + '/device-list',
            error: function(xhr, status, err) {
                console.log(xhr);
            }
        }).done(function(data) {
            var deviceList = Object.keys(data);
            deviceList.forEach(function(deviceID) {
                $.ajax({
                    type: 'POST',
                    url: _this.state.serverAddr + '/device-control/' + deviceID + '/connect'
                }).done(function(result) {
                    $.ajax({
                        type: 'GET',
                        url: _this.state.serverAddr + '/device-control/' + deviceID + '/get-spec'
                    }).done(function(spec) {
                        console.log(spec.device.friendlyName);
                        var di = _this.state.deviceInfo;
                        di[deviceID] = spec;
                        _this.setState({ deviceInfo: di });
                        var tests = _this.state.tests;
                        var name = spec.device.friendlyName;

                        var hasElement = false;
                        tests.forEach(function(item) {
                            if (item.label === name) hasElement = true;
                        });
                        if (hasElement === false) {
                            tests.push({label: spec.device.friendlyName, value: deviceID});
                            _this.setState(tests);
                        }
                    });
                });
            });
        });
    },

    onInvokeAction: function() {
        var _this = this;

        var deviceID   = this.state.deviceID;
        var serviceID  = this.state.serviceID;
        var actionName = this.state.actionName;
        var model = this.state.model;

        var argumentList = this.state.argumentList;
        // for demo simplicity only support one argument for now
        var argKey = Object.keys(argumentList);
        var name = argKey[0];
        console.log(name);
        var inputData = {};
        inputData[name] = model;

        $.ajax({
            type: 'POST',
            url: _this.state.serverAddr + '/device-control/' + this.state.deviceID + '/invoke-action',
            contentType: 'application/json',
            data: JSON.stringify({
                serviceID: serviceID,
                actionName: actionName,
                argumentList: inputData
            }),
            dataType: 'json',
            error: function(xhr, status, err) {
                console.log(xhr);
                _this.setState({outputModel: JSON.parse(xhr.responseText).message});
            }
        }).done(function(outputData) {
            var f = ["*"];
            _this.setState({ outputForm: f, outputModel: outputData });
        });
    },

    render: function() {
        var mapper = {
            "rc-select": RcSelect
        };

        var schemaForm = '';
        var outputSchemaForm = '';
        var validate = '';
        var invokeAction = '';
        if (this.state.form.length > 0) {
            schemaForm = (
                <SchemaForm schema={this.state.schema} form={this.state.form} model={this.state.model} onModelChange={this.onModelChange} mapper={mapper} />
            );
            validate = (
                <div>
                    <RaisedButton primary={true} label="Validate" onTouchTap={this.onValidate} />
                    <pre>{JSON.stringify(this.state.validationResult,undefined,2,2)}</pre>
                </div>
            );

            invokeAction = (
                <div>
                    <RaisedButton primary={true} label="执行" onTouchTap={this.onInvokeAction} />
                </div>
            );
        }

        // if (this.state.outputForm.length > 0) {
        //     outputSchemaForm = (
        //         <SchemaForm schema={this.state.outputSchema} form={this.state.outputForm} model={this.state.outputModel} onModelChange={this.onOutputModelChange} />
        //     );
        // }

        return (
            <div className="col-md-12">
                <h1>API接口自动表单生成演示</h1>
                <div className="row">
                    <div className="col-sm-8">
                        <h3 style={{display:'inline-block'}}>输入表单</h3>
                        {schemaForm}
                        {invokeAction}
                        <h3>输入数据</h3>
                        <pre>{JSON.stringify(this.state.model,undefined,2,2)}</pre>
                        <h3>返回结果</h3>
                        <pre>{JSON.stringify(this.state.outputModel,undefined,2,2)}</pre>
                    </div>
                    <div className="col-sm-4">
                        <h3>服务器地址</h3>
                        <div className="row">
                            <TextField hintText="http://localhost:3049" id="text-field-controlled" value={this.state.serverAddr} onChange={this.onServerAddrChange} />
                            <RaisedButton primary={true} label="连接" onTouchTap={this.onConnectServer} />
                        </div>
                        <h3>Select Example</h3>
                        <div className="form-group">
                            <Select
                                name="selectTest"
                                value={this.state.selected}
                                options={this.state.tests}
                                onChange={this.onSelectChange}>
                            </Select>
                        </div>
                        <h3>API接口列表</h3>
                        <h3>{this.state.apis}</h3>
                        <AceEditor mode="json" theme="github" height="300px" width="800px" onChange={this.onFormChange} name="aceForm" value={this.state.formJson} editorProps={{$blockScrolling: true}}/>
                        <h3>Schema</h3>
                        <AceEditor mode="json" theme="github" height="300px" width="800px" onChange={this.onSchemaChange} name="aceSchema" value={this.state.schemaJson} editorProps={{$blockScrolling: true}}/>
                    </div>
                </div>
            </div>
        );
    }
});

module.exports = ExamplePage;
