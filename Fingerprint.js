/**
 * Created by Alex on 14-3-2015.
 */

function Fingerprint(){}

/** If debug is true send detailed messages to the console
 * @type {boolean}
 */
Fingerprint.debug = true;

/** Serial connection
 * @member {SerialPort} serial
 * @memberOf Fingerprint
 * @instance
 */
Fingerprint.prototype.serial = null;

/** Baudrate to be used
 * Defaults to 57600. Should be one of: 115200, 57600, 38400, 19200, 9600, 4800, 2400, 1800, 1200, 600, 300, 200, 150, 134, 110, 75, or 50. Custom rates as allowed by hardware is supported.
 * @type {number}
 */
Fingerprint.prototype.baudrate = 57600;
/** Port to be used
 * Defaults to /dev/ttyAMA0
 * @type {string}
 */
Fingerprint.prototype.port = '/dev/ttyAMA0';
/** Databits to be used
 * Defaults to 8. Must be one of: 8, 7, 6, or 5.
 * @type {number}
 */
Fingerprint.prototype.dataBits = 8;
/** Stopbits to be used
 * Defaults to 1. Must be one of: 1 or 2.
 * @type {number}
 */
Fingerprint.prototype.stopBits = 1;
/** Paritybit to be used
 * Defaults to none. Must be one of: 'none', 'even', 'mark', 'odd', 'space'
 * @type {STRING}
 */
Fingerprint.prototype.parityBit = 'none';

/** Command queue to dont mess up the messages
 * @type {Array}
 */
Fingerprint.prototype.queue = [];
/** This object is used to see which command is running at the moment
 * @type {FingerprintCommand}
 */
Fingerprint.prototype.pendingCommand = null;

/* Functions */
/** Create a serial connection
 */
Fingerprint.prototype.begin = function(){
    var SerialPort = require("serialport").SerialPort;
    var serialPort = new SerialPort(this.port, {
        baudrate: this.baudrate,
        databits: this.dataBits,
        stopbits: this.stopBits,
        parity: this.parityBit
    }, false);

    me = this;
    serialPort.open(function (error) {
            if ( error ) {
                Fingerprint.dlog('failed to open: '+error);
            } else {
                Fingerprint.dlog('connection opened');
                me.serial = serialPort;
                me.serial.flush();
                me.serial.on('data', function(data) {
                    me.pendingCommand.callback(data);
                    me.pendingCommand = null;
                    Fingerprint.dlog("Data received :: " + data);
                    me.write();
                });
                me.serial.on('close', function() {
                    me.serial = null;
                    Fingerprint.dlog('Serial Connection closed');
                });
            }
        }
    );

};

/** Write packet to Sensor if there are no pending commands
 */
Fingerprint.prototype.write = function(){
    if(this.pendingCommand === null || this.queue.length() > 1)
        return;

    Fingerprint.dlog("Send Command to the sensor");
    this.pendingCommand = this.queue.unshift();

    this.serial.write(this.pendingCommand.packet);

};

/** Add FingerprintCommand to queue
 */
Fingerprint.prototype.addToQueue = function(callback){
    this.queue.push(new FingerprintCommand(packet, callback));
    this.write();
};

/** Used to send debug messages to the console
 * @param message
 */
Fingerprint.dlog = function(message){
    var date = new Date();
    if(Fingerprint.debug)
        console.log(date.toLocaleDateString() + " FP ::" + message);
}

/** Used for the queue
 * @constructor
 */
function FingerprintCommand(packet, callback){
    this.packet = packet;
    this.callback = callback;
}