function Instances() {
}

Instances.prototype = Object.create({}, {
    constructor: {
        value: Instances,
        enumerable: false
    }
});

module.exports = Instances;

Instances.prototype.save = function() {
    console.log('save instance');
};

Instances.prototype.find = function() {
    console.log('find instance');
};

Instances.prototype.remove = function() {
    console.log('remove instance');
};

Instances.prototype.configure = function() {
    console.log('configure instance');
};