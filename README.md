orgchart
========

A jquery ui widget that draw organization chart with Raphael.js

Usage
=======

See the examples in `example/` folder.

In the implementation, I traverse the data tree and 
count the total fonts width (consider lowercase character and `().` half font width)
to use in both vertical and horizontal direction,
then use the width and height option to determine the suitable fontsize.

There are case to draw vertical boxes.
Cause not every broswer support `writingMode` and `glyphOrientationVertical`,
I rotate the characters manually.

Random color isn't suite for presentation and revealing the consistency of nodes.
In the `example/hashcolor.html` , I hash the node name to some predefined colors.

License
=======

Distributed under the MIT LICENSE, the same as jQuery and jQuery UI.