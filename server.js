//-------------------
// GLOBAL DEFINITIONS
//-------------------
const theAdminLogin = "moa";
//const theAdminPassword = "0304";
const theAdminPassword =
  "$2b$12$WcaCdnllti5jXCJT1UZvpuO/xwxR8JjW3f6lmYTHcJV2uPQFc1/TO"; // hash password

//---------
// PACKAGES
//---------
const express = require("express");
const { engine } = require("express-handlebars");


const path = require("path");
const sqlite3 = require("sqlite3"); // load the sqlite3 package
const session = require("express-session");
const connectSqlite3 = require("connect-sqlite3");
const fs = require("fs"); // import the fs module

const bcrypt = require("bcrypt");
const saltRounds = 12;

/*
bcrypt.hash(theAdminPassword, saltRounds, function (err, hash) {
  if (err) {
    console.log("----> Error encrypting the password: ", err);
  } else {
    console.log("----> Hashed password (GENERATE only ONCE): ", hash);
  }
});
*/

//-----
// PORT
//-----
const port = 4321;

//------------
// APPLICATION
//------------
const app = express();

//---------
// DATABASE
//---------
const dbFile = "my-data.sqlite3.db";
let db;

// check if the database file exists
if (!fs.existsSync(dbFile)) {
  // if it does not exist, create a new one
  db = new sqlite3.Database(dbFile, (err) => {
    if (err) {
      console.error(err.message);
    } else {
      console.log("Database created or opened successfully.");

      // ------create new tables---------
      // albums table
      db.run(
        `CREATE TABLE albums (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                release_date TEXT,
                cover_image TEXT,
                title_song TEXT
            )`,
        (err) => {
          if (err) {
            console.error(err.message);
          } else {
            console.log('Table "albums" created.');
            // insert initial data
            initializeAlbumsData();
          }
        }
      );

      // group table
      db.run(
        `CREATE TABLE group_info (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT NOT NULL,
                date TEXT NOT NULL,
                category TEXT NOT NULL
            )`,
        (err) => {
          if (err) {
            console.error(err.message);
          } else {
            console.log('Table "group_info" created.');
            // insert initial data
            initializeGroupData();
          }
        }
      );

      // members table
      db.run(
        `CREATE TABLE members (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                birthday TEXT,
                mbti TEXT,
                zodiac_sign TEXT,
                blood_type TEXT,
                image TEXT
            )`,
        (err) => {
          if (err) {
            console.error(err.message);
          } else {
            console.log('Table "members" created.');
            // insert initial data
            initializeMembersData();
          }
        }
      );

      // locations table
      db.run(
        `CREATE TABLE locations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT NOT NULL,
          name TEXT NOT NULL,
          link TEXT NOT NULL,
          country TEXT NOT NULL,
          address TEXT NOT NULL,
          year TEXT NOT NULL
        )`,
        (err) => {
          if (err) {
            console.error(err.message);
          } else {
            console.log('Table "locations" created.');
            // insert initial data
            initializeLocationsData();
          }
        }
      );

      // outfits table
      db.run(
        `CREATE TABLE IF NOT EXISTS outfits (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          item_type TEXT NOT NULL,
          brand TEXT NOT NULL,
          image TEXT NOT NULL
        )`,
        (err) => {
          if (err) {
            console.error("Error creating outfits table:", err.message);
          } else {
            console.log('Table "outfits" created.');
            // insert initial data
            initializeOutfitsData();
          }
        }
      );

      // foods table
      db.run(
        `CREATE TABLE IF NOT EXISTS foods (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         name TEXT NOT NULL,
         brand TEXT NOT NULL,
         price TEXT NOT NULL,
         recommended_by INTEGER NOT NULL,
         FOREIGN KEY (recommended_by) REFERENCES members(id)
        )`,
        (err) => {
          if (err) {
            console.error("Error creating foods table:", err.message);
          } else {
            console.log('Table "foods" created.');
            // insert initial data
            initializeFoodsData();
          }
        }
      );

      // events table
      db.run(
        `CREATE TABLE IF NOT EXISTS events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          concert_date TEXT NOT NULL,
          country TEXT NOT NULL,
          place TEXT NOT NULL
        )`,
        (err) => {
          if (err) {
            console.error("Error creating events table:", err.message);
          } else {
            console.log('Table "events" created.');
            // insert initial data
            initializeEventsData();
          }
        }
      );


      // venues table
      db.run(
        `CREATE TABLE IF NOT EXISTS venues (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          event_id INTEGER NOT NULL,
          address TEXT NOT NULL,
          capacity INTEGER NOT NULL,
          open_hours TEXT,
          FOREIGN KEY (event_id) REFERENCES events(id)
        )`,
        (err) => {
          if (err) {
            console.error("Error creating venues table:", err.message);
          } else {
            console.log('Table "venues" created.');
            // insert initial data
            initializeVenuesData();
          }
        }
      );
    
      // users table
      db.run(
        `CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        (err) => {
            if (err) {
                console.error(err.message);
            } else {
                console.log('Table "users" created.');
            }
        }
    );
    }
  });
} else {
  // if it exists, open the database
  db = new sqlite3.Database(dbFile, (err) => {
    if (err) {
      console.error(err.message);
    }
    console.log("Connected to the existing database.");



  });
}

//---------database model-----------

// model for group
const group_info = [
  {
    id: 1,
    name: "TOMORROW X TOGETHER",
    description:
      "TOMORROW X TOGETHER, read as 'tomorrow by together', is a bright and youthful boyband aiming to become the next global breakthrough artist. The band is composed of five members, SOOBIN, YEONJUN, BEOMGYU, TAEHYUN, HUENINGKAI, where each member is different from one another, shining in their own way to create synergy.",
    date: "2019-03-04",
    category: "K-POP Group",
  },
  {
    id: 2,
    name: "MOA",
    description:
      "MOA is the official fandom name for TOMORROW X TOGETHER. MOA meaning: Moment of Alwaysness: Each and every moment shared by TXT (TOMORROW X TOGETHER) and our fans, always and forever.",
    date: "2019-08-22",
    category: "Fandom",
  },
  {
    id: 3,
    name: "Crown",
    description:
      "TXT's first music show performance aired on March 7, 2019, on Mnet's M Countdown. They earned their first music show win on SBS MTV's The Show with Crown, just after one week after their debut, followed by wins on M Countdown and Show Champion.",
    date: "2019-03-07",
    category: "Achievement",
  },
];

// model for members
const members = [
  {
    id: 1,
    name: "Soobin",
    birthday: "2000-12-05",
    mbti: "ISFP",
    zodiac_sign: "Sagittarius",
    blood_type: "A",
    image: "img/soobin.png", // 添加图片链接
  },
  {
    id: 2,
    name: "Yeonjun",
    birthday: "1999-09-13",
    mbti: "ENFP",
    zodiac_sign: "Virgo",
    blood_type: "A",
    image: "img/yeonjun.png", // 添加图片链接
  },
  {
    id: 3,
    name: "Beomgyu",
    birthday: "2001-03-13",
    mbti: "INFJ",
    zodiac_sign: "Pisces",
    blood_type: "AB",
    image: "img/beomgyu.png", // 添加图片链接
  },
  {
    id: 4,
    name: "Taehyun",
    birthday: "2002-02-05",
    mbti: "ESTP",
    zodiac_sign: "Aquarius",
    blood_type: "A",
    image: "img/taehyun.png", // 添加图片链接
  },
  {
    id: 5,
    name: "Hueningkai",
    birthday: "2002-08-14",
    mbti: "ISTP",
    zodiac_sign: "Leo",
    blood_type: "A",
    image: "img/hueningkai.png", // 添加图片链接
  },
];

// model for albums
const albums = [
  {
    id: 1,
    title: "The Dream Chapter: STAR",
    release_date: "2019-03-04",
    cover_image: "img/the_dream_chapter_star.jpg",
    title_song: "CROWN",
    audio_file: "https://soundcloud.com/tomorrowxtogether/crown",
  },
  {
    id: 2,
    title: "The Dream Chapter: MAGIC",
    release_date: "2019-10-21",
    cover_image: "img/the_dream_chapter_magic.jpg",
    title_song: "9 and Three Quarters",
    audio_file:
      "https://soundcloud.com/tomorrowxtogether/9-and-three-quarters-run-away",
  },
  {
    id: 3,
    title: "The Dream Chapter: ETERNITY",
    release_date: "2020-05-18",
    cover_image: "img/the_dream_chapter_eternity.jpg",
    title_song: "Cant You See Me?",
    audio_file: "https://soundcloud.com/tomorrowxtogether/cant-you-see-me",
  },
  {
    id: 4,
    title: "Minisode 1: Blue Hour",
    release_date: "2020-10-26",
    cover_image: "img/minisode1_blue_hour.jpg",
    title_song: "Blue Hour",
    audio_file: "https://soundcloud.com/tomorrowxtogether/blue-hour",
  },
  {
    id: 5,
    title: "The Chaos Chapter: FREEZE",
    release_date: "2021-05-31",
    cover_image: "img/the_chaos_chapter_freeze.jpg",
    title_song: "0X1 LOVESONG",
    audio_file:
      "https://soundcloud.com/tomorrowxtogether/0x1-lovesong-i-know-i-love-you",
  },
  {
    id: 6,
    title: "The Chaos Chapter: FIGHT OR ESCAPE",
    release_date: "2021-08-17",
    cover_image: "img/the_chaos_chapter_fight_or_escape.jpg",
    title_song: "LO$ER LO♡ER",
    audio_file: "https://soundcloud.com/tomorrowxtogether/lo-er-l-ver",
  },
  {
    id: 7,
    title: "Minisode 2: Thursdays Child",
    release_date: "2022-05-09",
    cover_image: "img/minisode2_thursdays_child.jpg",
    title_song: "Good Boy Gone Bad",
    audio_file: "https://soundcloud.com/tomorrowxtogether/good-boy-gone-bad",
  },
  {
    id: 8,
    title: "The Name Chapter: TEMPTATION",
    release_date: "2023-01-27",
    cover_image: "img/the_name_chapter_temptation.jpg",
    title_song: "Sugar Rush Ride",
    audio_file: "https://soundcloud.com/tomorrowxtogether/sugar-rush-ride",
  },
  {
    id: 9,
    title: "The Name Chapter: FREEFALL",
    release_date: "2023-10-13",
    cover_image: "img/the_name_chapter_freefall.jpg",
    title_song: "Chasing That Feeling",
    audio_file: "https://soundcloud.com/tomorrowxtogether/chasing-that-feeling",
  },
  {
    id: 10,
    title: "Minisode 3: TOMORROW",
    release_date: "2024-04-01",
    cover_image: "img/minisode3_tomorrow.jpg",
    title_song: "Deja Vu",
    audio_file: "https://soundcloud.com/tomorrowxtogether/deja-vu",
  },
];

// model for locations
const locations = [
  {
    id: 1,
    type: "Vlog", // Type of content
    name: "5th Anniversary Ganghwa Island Trip",
    link: "https://www.youtube.com/watch?v=L28YlDKs25U", // Link to specific content
    country: "South Korea", // Country of shooting
    address:
      "Dongmak Beach, 1481 Haeannam-ro, Hwado-myeon, Ganghwa-gun, Incheon", // Specific address
    year: "2024",
  },
  {
    id: 2,
    type: "Photobook", // Type of content
    name: "Season of TXT: YOUTH",
    link: "https://weverse.io/txt/media/4-128223916", // Link to specific content
    country: "Japan", // Country of shooting
    address:
      "Suma Seaside Park 1-3-1 Wakamiyacho, Suma-ku, Kobe City, Hyogo Prefecture, 654-0049", // Specific address
    year: "2023",
  },
  {
    id: 3,
    type: "Variety Show", // Type of content
    name: "[ONE DREAM.TXT] Reality Ep.06",
    link: "https://www.youtube.com/watch?v=n_-uB7LNSL4&list=PLcZxoPUYVQX10oqupDE8cVYKFmZIHY-eT&index=9", // Link to specific content
    country: "America", // Country of shooting
    address: "1120 W 6th St, Los Angeles, CA 90017", // Specific address
    year: "2019",
  },
  {
    id: 4,
    type: "Social Media", // Type of content
    name: "Singapore",
    link: "https://www.instagram.com/bamgyuuuu/?hl=en", // Link to specific content
    country: "Singapore", // Country of shooting
    address: "10A Siloso Bch Walk", // Specific address
    year: "2024",
  },
  {
    id: 5,
    type: "Variety Show", // Type of content
    name: "The Perfect Way to Rest",
    link: "https://www.youtube.com/watch?v=eRNWzrMVUu8", // Link to specific content
    country: "South Korea", // Country of shooting
    address: "40-6, Yeonseo-ro 48-gil, Eunpyeong-gu, Seoul", // Specific address
    year: "2024",
  },
  {
    id: 6,
    type: "Music Video", // Type of content
    name: "LO$ER=LO♡ER Official MV",
    link: "https://www.youtube.com/watch?v=JzODRUBBXpc", // Link to specific content
    country: "South Korea", // Country of shooting
    address: "23, Keunmal-ro, Jung-gu, Incheon, Seaside Park", // Specific address
    year: "2021",
  },
];

// model for outfits
const outfits = [
  {
    id: 1,
    item_type: "Shirt", // Type of content, e.g., tops
    brand: "MADEWORN",
    image: "img/outfit1.png", // 图片的路径
  },
  {
    id: 2,
    item_type: "Necklace", // Type of content, e.g., bottoms
    brand: "WILD BRICKS",
    image: "img/outfit2.png", // 图片的路径
  },
  {
    id: 3,
    item_type: "Headphones", // Type of content, e.g., accessories
    brand: "Marshall",
    image: "img/outfit3.png", // 图片的路径
  },
  {
    id: 4,
    item_type: "Shirt", // Type of content, e.g., accessories
    brand: "RIVINGTON ROI REBIS",
    image: "img/outfit4.png", // 图片的路径
  },
  {
    id: 5,
    item_type: "Shirt", // Type of content, e.g., accessories
    brand: "HUMAN MADE",
    image: "img/outfit5.png", // 图片的路径
  },
  {
    id: 6,
    item_type: "Shoes", // Type of content, e.g., accessories
    brand: "Nike & New Balance",
    image: "img/outfit6.png", // 图片的路径
  },
];

// model for foods
const foods = [
  {
    id: 1,
    name: "Strawberry Ice cream",
    brand: "Haagen Dazs",
    price: "18$",
    recommended_by: 4,
  },
  {
    id: 2,
    name: "Boba Tea",
    brand: "TheDoo",
    price: "5$",
    recommended_by: 5,
  },
  {
    id: 3,
    name: "Fried Chicken",
    brand: "Doshieobu",
    price: "21$",
    recommended_by: 2,
  },
  {
    id: 4,
    name: "Grape Soda",
    brand: "Minute Maid",
    price: "2$",
    recommended_by: 1,
  },
  {
    id: 5,
    name: "Vanilla Ice cream",
    brand: "Binggrae",
    price: "6$",
    recommended_by: 3,
  },
  {
    id: 6,
    name: "Hamburger",
    brand: "Burgerboy",
    price: "20$",
    recommended_by: 1,
  },
];

// model for events
const events = [
  {
    id: 1,
    concert_date: "2 JUNE 2024",
    country: "AMERICA",
    place: "MADISON SQUARE GARDEN",
  },
  {
    id: 2,
    concert_date: "8 JUNE 2024",
    country: "AMERICA",
    place: "CAPITAL ONE ARENA",
  },
  {
    id: 3,
    concert_date: "11 JULY 2024",
    country: "JAPAN",
    place: "TOKYO DOME",
  },
  {
    id: 4,
    concert_date: "5 AUGUST 2024",
    country: "JAPAN",
    place: "VANTELIN DOME NAGOYA",
  },
  {
    id: 5,
    concert_date: "30 AUGUST 2024",
    country: "CHINA",
    place: "GALAXY ARENA",
  },
  {
    id: 6,
    concert_date: "7 SEPTEMBER 2024",
    country: "SINGAPORE",
    place: "SINGAPORE INDOOR STADIUM",
  },
  {
    id: 7,
    concert_date: "14 SEPTEMBER 2024",
    country: "JAPAN",
    place: "PAYPAY DOME",
  },
  {
    id: 8,
    concert_date: "2 OCTOBER 2024",
    country: "INDONESIA",
    place: "ICE BSD HALL",
  },
  {
    id: 9,
    concert_date: "5 OCTOBER 2024",
    country: "CHINA",
    place: "NTSU ARENA",
  },
  {
    id: 10,
    concert_date: "1 NOVEMBER 2024",
    country: "KOREA",
    place: "KSPO DOME",
  },
  {
    id: 11,
    concert_date: "30 NOVEMBER 2024",
    country: "JAPAN",
    place: "KYOCERA DOME OSAKA",
  },
  {
    id: 12,
    concert_date: "1 DECEMBER 2024",
    country: "JAPAN",
    place: "KYOCERA DOME OSAKA",
  },
];


// models for venues
const venues = [
  {
    id: 1,
    event_id: 1,
    address: "New York, NY 10001, United States",
    capacity: "19500",
    open_hours: "9:00-18:00",
  },
  {
    id: 2,
    event_id: 2,
    address: "601 F St NW, Washington, DC 20004, United States",
    capacity: "20356",
    open_hours: "12:00-16:00",
  },
  {
    id: 3,
    event_id: 3,
    address: "1-chōme-3-61 Kōraku, Bunkyo City, Tokyo 112-0004, Japan",
    capacity: "55000",
    open_hours: "10:00-21:00",
  },
  {
    id: 4,
    event_id: 4,
    address: "1-chōme-1-1 Daikōminami, Higashi Ward, Nagoya, Aichi 461-0047, Japan",
    capacity: "50619",
    open_hours: "Hours of operation may vary by each event",
  },
  {
    id: 5,
    event_id: 5,
    address: "Galaxy Macau Integrated Resort, Macao",
    capacity: "16000",
    open_hours: "10:00-23:00",
  },
  {
    id: 6,
    event_id: 6,
    address: "2 Stadium Walk, Singapore 397691",
    capacity: "12000",
    open_hours: "9:00-18:00",
  },
  {
    id: 7,
    event_id: 7,
    address: "2-chōme-2-2 Jigyōhama, Chuo Ward, Fukuoka, 810-8660, Japan",
    capacity: "47500",
    open_hours: "Varies by Event and Game Date",
  },
  {
    id: 8,
    event_id: 8,
    address: "Kec. Pagedangan, Kabupaten Tangerang, Banten 15339, Indonesia",
    capacity: "50000",
    open_hours: "8:30-17:30",
  },
  {
    id: 9,
    event_id: 9,
    address: "No. 250, Wenhua 1st Rd, Guishan District, Taoyuan City, Taiwan 333",
    capacity: "15000",
    open_hours: "8:00-20:30",
  },
  {
    id: 10,
    event_id: 10,
    address: "424 Olympic-ro, Songpa District, Seoul, South Korea",
    capacity: "15000",
    open_hours: "9:00-22:00",
  },
  {
    id: 11,
    event_id: 11,
    address: "3-chōme-2-1 Chiyozaki, Nishi Ward, Osaka, 550-0023, Japan",
    capacity: "36220",
    open_hours: "11:00-18:00",
  },
  {
    id: 12,
    event_id: 12,
    address: "3-chōme-2-1 Chiyozaki, Nishi Ward, Osaka, 550-0023, Japan",
    capacity: "36220",
    open_hours: "11:00-18:00",
  },
]


//---------
// SESSIONS
//---------
const SQLiteStore = connectSqlite3(session); // store sessions in the database

app.use(
  session({
    // define the session
    store: new SQLiteStore({ db: "sessions-db.db" }),
    saveUninitialized: false,
    resave: false,
    secret: "This123Is@Another#456GreatSecret678%Sentence",
  })
);

//------------
// MIDDLEWARES
//------------


app.use((req, res, next) => {
  res.locals.isLoggedIn = req.session.isLoggedIn || false;
  res.locals.name = req.session.name || null;
  res.locals.isAdmin = req.session.isAdmin || false;
  next();
});

app.use(express.static("public")); // make everything public in the 'public' directory
// using express middleware for processing forms sent using the "post" method
app.use(express.urlencoded({ extended: true }));

//------------
// VIEW ENGINE
//------------

app.engine(
  "handlebars",
  
  engine({
    helpers: {
      unescaped: function (str) {
        return str;
      },
      paginate: function (currentPage, totalPages, options) {
        let output = "";
        for (let i = 1; i <= totalPages; i++) {
          if (i === currentPage) {
            output += `<li class="active"><a href="?page=${i}">${i}</a></li>`;
          } else {
            output += `<li><a href="?page=${i}">${i}</a></li>`;
          }
        }
        return new Handlebars.SafeString(output);
      },
      gt: function (a, b) {
        return a > b;
      },
      lt: function (a, b) {
        return a < b;
      },
      increment: function (value) {
        return parseInt(value) + 1;
      },
      decrement: function (value) {
        return parseInt(value) - 1;
      },
      range: function (start, end) {
        let rangeArray = [];
        for (let i = start; i <= end; i++) {
          rangeArray.push(i);
        }
        return rangeArray;
      },
      eq: function (a, b) {
        return a == b;
      },
      split: function (string, delimiter) {
        return string.split(delimiter);
      },
    },
  })
);

app.set("view engine", "handlebars"); // set the view engine to handlebars
app.set("views", "./views"); // define the views directory to be ./views


//-------
// ROUTES
//-------


// home page
app.get("/", (req, res) => {
  //console.log("SESSIONS: " + JSON.stringify(request.session));

  const model = {
    isLoggedIn: req.session.isLoggedIn,
    name: req.session.name,
    isAdmin: req.session.isAdmin,
  };
  res.render("home.handlebars", model);
});

// about page
app.get("/about", (req, res) => {
  res.render("about", {
    group: group_info,
    members: members,
  });
});

// music page
app.get("/music", (req, res) => {
  res.render("music", {
    albums: albums, // 直接使用内存中的数据
  });
});

// imprints page
app.get("/imprints", (req, res) => {
  // get paging parameters and default is the first page
  const locationsPage = parseInt(req.query.locationsPage) || 1;
  const outfitsPage = parseInt(req.query.outfitsPage) || 1;
  const foodsPage = parseInt(req.query.foodsPage) || 1;

  const itemsPerPage = 3; // number of items to display per page

  // calculate the offset for each category based on the current page and items per page
  const locationsOffset = (locationsPage - 1) * itemsPerPage;
  const outfitsOffset = (outfitsPage - 1) * itemsPerPage;
  const foodsOffset = (foodsPage - 1) * itemsPerPage;

  // retrieve data for locations, outfits, and foods
  const locationsQuery = "SELECT * FROM locations LIMIT ? OFFSET ?";
  const outfitsQuery = "SELECT * FROM outfits LIMIT ? OFFSET ?";
  const foodsQuery = `
        SELECT foods.id, foods.name, foods.brand, foods.price, members.name AS recommended_by
        FROM foods
        INNER JOIN members ON foods.recommended_by = members.id
        LIMIT ? OFFSET ?`;

  // count total records for pagination
  const locationsCountQuery = "SELECT COUNT(*) AS count FROM locations";
  const outfitsCountQuery = "SELECT COUNT(*) AS count FROM outfits";
  const foodsCountQuery = "SELECT COUNT(*) AS count FROM foods";

  // execute the count query for locations
  db.get(locationsCountQuery, (err, locationsCountResult) => {
    const totalLocationsPages = Math.ceil( // calculate total pages
      locationsCountResult.count / itemsPerPage
    );

    // execute the count query for outfits
    db.get(outfitsCountQuery, (err, outfitsCountResult) => {
      const totalOutfitsPages = Math.ceil( // calculate total pages
        outfitsCountResult.count / itemsPerPage
      );

      // execute the count query for foods
      db.get(foodsCountQuery, (err, foodsCountResult) => {
        const totalFoodsPages = Math.ceil( // calculate total pages
          foodsCountResult.count / itemsPerPage
        );

        // retrieve locations data based on the calculated offset and limit
        db.all(
          locationsQuery,
          [itemsPerPage, locationsOffset],
          (err, locationRows) => {
            if (err)
              return res.status(500).send("Error retrieving locations data.");

            // retrieve outfits data based on the calculated offset and limit
            db.all(
              outfitsQuery,
              [itemsPerPage, outfitsOffset],
              (err, outfitRows) => {
                if (err)
                  return res.status(500).send("Error retrieving outfits data.");

                 // retrieve foods data based on the calculated offset and limit
                db.all(
                  foodsQuery,
                  [itemsPerPage, foodsOffset],
                  (err, foodRows) => {
                    if (err)
                      return res
                        .status(500)
                        .send("Error retrieving foods data.");

                        //console.log("Food Rows:", foodRows);  
                    // render the imprints page and pass all retrieved data and pagination info 
                    res.render("imprints", {
                      // data
                      locations: locationRows,
                      outfits: outfitRows,
                      foods: foodRows,
                      // current page
                      locationsCurrentPage: locationsPage,
                      outfitsCurrentPage: outfitsPage,
                      foodsCurrentPage: foodsPage,
                      // total pages
                      totalLocationsPages: totalLocationsPages,
                      totalOutfitsPages: totalOutfitsPages,
                      totalFoodsPages: totalFoodsPages,
                    });
                  }
                );
              }
            );
          }
        );
      });
    });
  });
});

// locations section in imprints page
app.get("/locations", (req, res) => {
  // get paging parameters and default is the first page
  const locationsPage = parseInt(req.query.locationsPage) || 1;
  const outfitsPage = parseInt(req.query.outfitsPage) || 1;
  const foodsPage = parseInt(req.query.foodsPage) || 1;

  const itemsPerPage = 3;
  const offset = (locationsPage - 1) * itemsPerPage;

  const query = "SELECT * FROM locations ORDER BY id LIMIT ? OFFSET ?"; // get locations with pagination
  const countQuery = "SELECT COUNT(*) AS count FROM locations"; // count total locations

  db.get(countQuery, (err, result) => {
    if (err) {
      console.error("Error retrieving locations count:", err.message);
      res.status(500).send("Error retrieving locations count.");
    } else {
      const totalLocationsPages = Math.ceil(result.count / itemsPerPage); // calculate total pages

      db.all(query, [itemsPerPage, offset], (err, rows) => {
        if (err) {
          console.error(err.message);
          res.status(500).send("Error retrieving locations data.");
        } else {
          res.render("locations", {
            locations: rows,
            locationsCurrentPage: locationsPage,
            outfitsCurrentPage: outfitsPage, // keep outfits pagination state
            foodsCurrentPage: foodsPage, // keep foods pagination state
            totalLocationsPages: totalLocationsPages,
          });
        }
      });
    }
  });
});


// outfits section in imprints page
app.get("/outfits", (req, res) => {
  // get paging parameters and default is the first page
  const outfitsPage = parseInt(req.query.outfitsPage) || 1;
  const locationsPage = parseInt(req.query.locationsPage) || 1;
  const foodsPage = parseInt(req.query.foodsPage) || 1;

  const itemsPerPage = 3;
  const offset = (outfitsPage - 1) * itemsPerPage;

  const query = "SELECT * FROM outfits ORDER BY id LIMIT ? OFFSET ?"; // get outfits with pagination
  const countQuery = "SELECT COUNT(*) AS count FROM outfits"; // count total outfits

  db.get(countQuery, (err, result) => {
    if (err) {
      console.error("Error retrieving outfits count:", err.message);
      res.status(500).send("Error retrieving outfits count.");
    } else {
      const totalOutfitsPages = Math.ceil(result.count / itemsPerPage); // calculate total pages

      db.all(query, [itemsPerPage, offset], (err, rows) => {
        if (err) {
          console.error(err.message);
          res.status(500).send("Error retrieving outfits data.");
        } else {
          res.render("outfits", {
            outfits: rows,
            outfitsCurrentPage: outfitsPage,
            locationsCurrentPage: locationsPage, // keep locations pagination state
            foodsCurrentPage: foodsPage,  // keep foods pagination state
            totalOutfitsPages: totalOutfitsPages,
          });
        }
      });
    }
  });
});

// foods section in imprints page
app.get("/foods", (req, res) => {
  // get paging parameters and default is the first page
  const foodsPage = parseInt(req.query.foodsPage) || 1;
  const locationsPage = parseInt(req.query.locationsPage) || 1;
  const outfitsPage = parseInt(req.query.outfitsPage) || 1;

  const itemsPerPage = 3;
  const offset = (foodsPage - 1) * itemsPerPage;

  const query = "SELECT id, name, brand, price FROM foods ORDER BY id LIMIT ? OFFSET ?"; // get foods with pagination
  const countQuery = "SELECT COUNT(*) AS count FROM foods"; // count total foods


  db.get(countQuery, (err, result) => {
    if (err) {
      console.error("Error retrieving foods count:", err.message);
      res.status(500).send("Error retrieving foods count.");
    } else {
      const totalFoodsPages = Math.ceil(result.count / itemsPerPage); // calculate total pages

      db.all(query, [itemsPerPage, offset], (err, rows) => {
        if (err) {
          console.error("Error retrieving foods data:", err.message);
          res.status(500).send("Error retrieving foods data.");
        } else {

          res.render("foods", {
            foods: rows,
            foodsCurrentPage: foodsPage,
            locationsCurrentPage: locationsPage, // keep locations pagination state
            outfitsCurrentPage: outfitsPage, // keep outfits pagination state
            totalFoodsPages: totalFoodsPages,
          });
        }
      });
    }
  });
});

// events page
app.get("/events", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const itemsPerPage = 3;
  const offset = (page - 1) * itemsPerPage;

  // query the total number of events and get the total number of pages
  db.get("SELECT COUNT(*) AS count FROM events", (err, result) => {
    if (err) {
      return res.status(500).send("Error retrieving events count.");
    }

    const totalEvents = result.count;
    const totalPages = Math.ceil(totalEvents / itemsPerPage); // 计算总页数

    // query the events data of the current page, ordered by id
    const query = `SELECT * FROM events ORDER BY id LIMIT ? OFFSET ?`;
    db.all(query, [itemsPerPage, offset], (err, events) => {
      if (err) {
        return res.status(500).send("Error retrieving events.");
      }

      const eventsWithVenues = [];

      // for loop to get venue info
      const getVenueInfo = async () => {
        for (const event of events) {
          try {
            const venue = await getVenueDetails(event.id);
            eventsWithVenues.push({ ...event, venue }); // combined event and venue info
          } catch (error) {
            console.error("Error fetching venue details:", error);
          }
        }

        res.render("events", {
          events: eventsWithVenues,
          currentPage: page,
          totalPages: totalPages,
        });
      };

      getVenueInfo();
    });
  });
});

// venues page
app.get("/venues/:id", function (req, res) {
  const venueId = parseInt(req.params.id); // extract the venue id and make sure it's an integer
  //console.log("Venue route parameter id: " + JSON.stringify(venueId));

  // query the venues data of the current page, ordered by id
  db.get("SELECT * FROM venues WHERE id = ? ORDER BY id", [venueId], (error, venueDetails) => {
    if (error) {
      console.log("ERROR: ", error);
      return res.status(500).send("Error retrieving venue details.");
    } else {
      const model = {
        venue: venueDetails
      };
      res.render("venues", model);
    }
  });
});

// contact page
app.get("/contact", (req, res) => {
  res.render("contact.handlebars");
});

app.post("/submit-contact", (req, res) => {
  const { name, email, message } = req.body;
  console.log(`Contact Form Submission: ${name}, ${email}, ${message}`); // receive the contact info users filled in
  req.session.successMessage = "Your message has been sent successfully!";
  res.render("contact.handlebars", { success: req.session.successMessage });
});

// login page
app.get("/login", (req, res) => {
  const successMessage = req.session.successMessage; // receive success message
  delete req.session.successMessage;
  const errorMessage = req.session.errorMessage; // receive error message
  delete req.session.errorMessage;
  res.render("login.handlebars", { success: successMessage, error: errorMessage });
});

app.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  // query the database to find the user's password (based on the entered username)
  db.get('SELECT password FROM users WHERE username = ?', [username], (err, row) => {
      if (err) {
          console.error("An error occurred while querying the user:", err);
          return res.status(500).send('Query failed');
      }

      if (row) { // if a user is found, compare the entered password with the hashed password
          bcrypt.compare(password, row.password, (err, isMatch) => {
              if (err) {
                  console.error("An error occurred while comparing password:", err);
                  return res.status(500).send('An error occurred while comparing password');
              }
              if (isMatch) { // if the password matches
                  req.session.isLoggedIn = true;
                  req.session.name = username;

                  res.redirect("/");
              } else { // if the password does not match
                  req.session.errorMessage = "The password is not correct";
                  res.redirect("/login");
              }
          });
      } else { // if no user found with the entered username
          req.session.errorMessage = "This account does not exist";
          res.redirect("/login");
      }
  });
});

app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
      if (err) {
          console.error("Error logging out:", err);
      }
      res.redirect("/");
  });
});

// register page
app.get("/register", (req, res) => {
  const errorMessage = req.query.error || '';
  res.render("register.handlebars", { errorMessage });
});

app.post("/register", (req, res) => {
  const { username, email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, saltRounds); // hash the password for secure storage

  // validate email format
  const emailPattern = /\S+@\S+\.\S+/; // got helped from https://medium.com/swlh/how-to-validate-an-email-address-in-javascript-78d33f87f5c6
  if (!emailPattern.test(email)) {
      const errorMessage = 'Invalid email format';
      return res.redirect(`/register?error=${encodeURIComponent(errorMessage)}`);
  }

  // query the database to check if username and email already exist
  db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, email], (err, row) => {
      if (err) {
          console.error('Database query error:', err);
          const errorMessage = 'Database error, please try again later.';
          return res.redirect(`/register?error=${encodeURIComponent(errorMessage)}`); // redirect to the register page with the error message
      }

      // alreay exist
      if (row) {
          const errorMessage = 'This email already exists';
          return res.redirect(`/register?error=${encodeURIComponent(errorMessage)}`); // redirect to the register page with the error message
      }

      // new user if the username and email do not exist
      db.run(
          'INSERT INTO users (username, email, password) VALUES (?, ?, ?)', 
          [username, email, hashedPassword],
          function(err) {
              if (err) {
                  console.error('Insert error:', err);
                  const errorMessage = 'Registration failed, please try again';
                  return res.redirect(`/register?error=${encodeURIComponent(errorMessage)}`); // redirect to the register page with the error message
              }
              res.redirect('/login'); 
          }
      );
  });
});


// profile page
app.get("/profile", (req, res) => {
  if (!req.session.isLoggedIn) {
      return res.redirect("/login");
  }

  const username = req.session.name;
  db.get('SELECT id, username FROM users WHERE username = ?', [username], (err, row) => {
      if (err) {
          return res.status(500).send('Query failed');
      }
      res.render('profile.handlebars', { user: row });
  });
});


app.post("/profile/update", (req, res) => {
  const { newUsername, password } = req.body;
  const currentUsername = req.session.name;

  // check if user entered new name or password
  if (!newUsername && !password) {
      return res.status(400).send('Please enter a new username or password'); // if both are empty
  }

  let query = 'UPDATE users SET';
  const params = [];

  // add new username to query and parameter
  if (newUsername) {
      query += ' username = ?';
      params.push(newUsername);
  }

  // add new password to query and parameter
  if (password) {
      const hashedPassword = bcrypt.hashSync(password, saltRounds);
      if (params.length > 0) {
          query += ',';
      }
      query += ' password = ?';
      params.push(hashedPassword);
  }

  query += ' WHERE username = ?';
  params.push(currentUsername);

  console.log('SQL Query:', query);
  console.log('Parameters:', params);

  db.run(query, params, function(err) {
      if (err) {
          console.error('Update error:', err);
          return res.status(400).send('Update failed, please try again');
      }
      req.session.name = newUsername || currentUsername; // update the username
      res.redirect("/profile");
});
});

app.post("/profile/delete", (req, res) => {
  const currentUsername = req.session.name;

  // execute the delete query to remove the user from the database
  db.run('DELETE FROM users WHERE username = ?', [currentUsername], (err) => {
      if (err) {
          console.error('Delete error:', err);
          return res.status(400).send('Delete failed, please try again');
      }
      // destroy the user session after successful deletion
      req.session.destroy((err) => {
          if (err) {
              console.error("Delete error:", err);
          }
          res.redirect("/");
      });
  });
});



//-------
// LISTEN
//-------


app.listen(port, function () {
  console.log(`Server up and running, listening on port ${port}`);
});



//----------
// FUNCTIONS
//----------

function initializeGroupData() {
  // clear existing data to ensure insertion
  db.run("DELETE FROM group_info", (err) => {
    if (err) {
      console.error(err.message);
    } else {
      // insert each group info into the database
      group_info.forEach((group) => {
        db.run(
          `INSERT INTO group_info (id, name, description, date, category) VALUES (?, ?, ?, ?, ?)`,
          [group.id, group.name, group.description, group.date, group.category],
          (err) => {
            if (err) {
              console.error(err.message);
            } else {
              console.log(`Group ${group.name} inserted successfully.`);
            }
          }
        );
      });
    }
  });
}


function initializeMembersData() {
  // clear existing data to ensure insertion
  db.run("DELETE FROM members", (err) => {
    if (err) {
      console.error(err.message);
    }
    // insert members into the database
    members.forEach((member) => {
      db.run(
        `INSERT INTO members (id, name, birthday, mbti, zodiac_sign, blood_type, image) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          member.id,
          member.name,
          member.birthday,
          member.mbti,
          member.zodiac_sign,
          member.blood_type,
          member.image,
        ],
        (err) => {
          if (err) {
            console.error(err.message);
          }
        }
      );
    });
  });
}


function initializeAlbumsData() {
  // clear existing data to ensure insertion
  db.run("DELETE FROM albums", (err) => {
    if (err) {
      console.error(err.message);
    }
    // insert albums into the database
    albums.forEach((album) => {
      db.run(
        `INSERT INTO albums (title, release_date, cover_image, title_song) VALUES (?, ?, ?, ?)`,
        [album.title, album.release_date, album.cover_image, album.title_song],
        (err) => {
          if (err) {
            console.error(err.message);
          }
        }
      );
    });
  });
}

function initializeLocationsData() {
  // clear existing data to ensure insertion
  db.run("DELETE FROM locations", (err) => {
    if (err) {
      console.error(err.message);
    }
     // insert locations into the database
    locations.forEach((location) => {
      db.run(
        `INSERT INTO locations (type, name, link, country, address, year) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          location.type,
          location.name,
          location.link,
          location.country,
          location.address,
          location.year,
        ],
        (err) => {
          if (err) {
            console.error(err.message);
          }
        }
      );
    });
  });
}

function initializeOutfitsData() {
  // clear existing data to ensure insertion
  db.run("DELETE FROM outfits", (err) => {
    if (err) {
      console.error(err.message);
    }
 // insert outfits into the database
    outfits.forEach((outfit) => {
      db.run(
        `INSERT INTO outfits (item_type, brand, image) VALUES (?, ?, ?)`,
        [outfit.item_type, outfit.brand, outfit.image],
        (err) => {
          if (err) {
            console.error(err.message);
          } else {
            //console.log(`Inserted outfit: ${outfit.item_type} - ${outfit.brand}`);
          }
        }
      );
    });
  });
}

function initializeFoodsData() {
  // clear existing data to ensure insertion
  db.run("DELETE FROM foods", (err) => {
    if (err) {
      console.error(err.message);
    }
     // insert foods into the database
    foods.forEach((food) => {
      db.run(
        `INSERT INTO foods (name, brand, price, recommended_by) VALUES (?, ?, ?, ?)`,
        [food.name, food.brand, food.price, food.recommended_by],
        (err) => {
          if (err) {
            console.error(err.message);
          }
        }
      );
    });
  });
}

function initializeEventsData() {
  // clear existing data to ensure insertion
  db.run("DELETE FROM events", (err) => {
    if (err) {
      console.error(err.message);
    }

     // insert events into the database
    events.forEach((event, index) => {
      db.run(
        `INSERT INTO events (id, concert_date, country, place) VALUES (?, ?, ?, ?)`,
        [index + 1, event.concert_date, event.country, event.place], // index + 1 make sure to start at 1
        (err) => {
          if (err) {
            console.error(err.message);
          }
        }
      );
    });
  });
}


function initializeVenuesData() {
  // clear existing data to ensure insertion
  db.run("DELETE FROM venues", (err) => {
    if (err) {
      console.error(err.message);
    }

    // insert venues into the database
    venues.forEach((venue, index) => {
      db.run(
        `INSERT INTO venues (id, event_id, address, capacity, open_hours) VALUES (?, ?, ?, ?, ?)`,
        [index + 1, venue.event_id, venue.address, venue.capacity, venue.open_hours], // index + 1 make sure to start at 1
        (err) => {
          if (err) {
            console.error(err.message);
          } else {
            console.log(`Inserted venue: ${venue.address}`);
          }
        }
      );
    });
  });
}

function getVenueDetails(eventId) {
  return new Promise((resolve, reject) => {
    const venue = venues.find(v => v.event_id === eventId); // find the corresponding venue
    //console.log("Looking for venue with event_id:", eventId);
    if (venue) {
      resolve(venue);
    } else {
      reject("Venue not found");
    }
  });
}
