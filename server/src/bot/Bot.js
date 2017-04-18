'use strict';

import ClassA from './ClassA';

let a: ClassA = new ClassA();
a.sayHi();

console.log('Bot starting...');
setInterval(() => {
    console.log('Bot is alive');
}, 5000);