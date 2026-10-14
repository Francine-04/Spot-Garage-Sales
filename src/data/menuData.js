export const menuGroups = [

  ["Coffee-Based",[["Varoom Classic",65],["Americano",75],["Hazelnut",85],["Spanish Latte",85],["Vanilla Latte",85],["Salted Caramel",85],["Seasalt Latte",95],["Iced Mocha",95],["Caramel Macchiato",95]]],

  ["Milk-Based",[["Strawberry Milk",85],["Blueberry Milk",85],["Mango Milk",85],["Mango Graham",95],["Biscoff",109],["Ube Milk",85],["Milky Oreo",85],["Milky Choco",85],["Matcha",85],["Matcha Oreo",95],["Matcha Berry",95]]],

  ["Fruit Soda",[["Strawberry Soda",59],["Blueberry Soda",59],["Green Apple Soda",59],["Grape Soda",59],["Lychee Soda",59]]],

  ["Yakult Series",[["Yakult Lemonade",69],["Strawberry Yakult",69],["Blueberry Yakult",69],["Green Apple Yakult",69],["Grape Yakult",69],["Lychee Yakult",69]]],

  ["Burgers",[["Classic Burger",149],["Cheese Burger",169],["Chicken Burger",149]]],

  ["Snacks",[["Flavored Fries",85],["Cheesy Bacon Fries",120],["Flavored Nachos",75],["Cheesy Nachos",99],["Nachos & Fries",139],["Nuggets & Fries",149]]],

  ["Rice Meals",[["Luncheon Meat",99],["Chicken Nuggets",129],["Chicken Fillet",129],["Cheesy Hungarian",129]]],

  ["Waffles (Classic)",[["Chocolate Oreo",79],["Cookies & Cream",79],["Caramel Graham",79],["Strawberry",79],["Matcha Almonds",79]]],

  ["Mini-Donuts (6pc)",[["Overload",75],["Cheesy Condensed",65],["Plain Syrup",59],["W/ Mini-Mallows",65],["W/ Rice Crispies",65],["W/ Crushed Oreo",69],["W/ Sliced Almonds",69]]]

];



export const categoryIcons={"Coffee-Based":"coffee","Milk-Based":"cup","Fruit Soda":"cup-water","Yakult Series":"bottle-soda-classic-outline",Burgers:"hamburger",Snacks:"french-fries","Rice Meals":"bowl-mix","Waffles (Classic)":"view-grid-outline","Mini-Donuts (6pc)":"circle-slice-8"};

export const menuItems=menuGroups.flatMap(([category,products])=>products.map(([name,price],index)=>({id:`${category}-${name}`,category,name,price,index:index+1})));



