//-------------------
// GLOBAL DEFINITIONS
//-------------------
const theAdminLogin = "moa";
//const theAdminPassword = "0304";
const theAdminPassword =
  "$2b$12$WcaCdnllti5jXCJT1UZvpuO/xwxR8JjW3f6lmYTHcJV2uPQFc1/TO";

//---------
// PACKAGES
//---------
const express = require("express");
const { engine } = require("express-handlebars");

//const Handlebars = require('handlebars');

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

// 检查数据库文件是否存在
if (!fs.existsSync(dbFile)) {
  // 如果不存在，创建新的数据库
  db = new sqlite3.Database(dbFile, (err) => {
    if (err) {
      console.error(err.message);
    } else {
      console.log("Database created or opened successfully.");

      // 创建必要的表
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
            // 插入初始数据
            initializeAlbumsData(); // 直接调用初始化数据的函数
          }
        }
      );

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
            initializeGroupData();
          }
        }
      );

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
            initializeMembersData();
          }
        }
      );

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
            initializeLocationsData();
          }
        }
      );

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
            initializeOutfitsData(); // 表创建后插入数据
          }
        }
      );

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
            initializeFoodsData(); // 表创建后插入数据
          }
        }
      );

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
            initializeEventsData(); // 表创建后插入数据
          }
        }
      );

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
  // 如果存在，打开数据库
  db = new sqlite3.Database(dbFile, (err) => {
    if (err) {
      console.error(err.message);
    }
    console.log("Connected to the existing database.");


    db.run(
      `ALTER TABLE users ADD COLUMN email TEXT NOT NULL UNIQUE`,
      (err) => {
          if (err) {
              if (err.message.includes("duplicate column name")) {
                  console.log('Email column already exists in "users" table.');
              } else {
                  console.error('Error adding email column:', err);
              }
          } else {
              console.log('Column "email" added to "users" table.');
          }
      }
  );

  });
}

// MODEL for group
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

// MODEL for members
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

// MODEL for albums
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
//app.engine("handlebars", engine()); // define the engine to be handlebars
//app.set("view engine", "handlebars"); // set the view engine to handlebars
//app.set("views", "./views"); // define the views directory to be ./views

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

/*
Handlebars.registerHelper("increment", function(value) {
  return value + 1;
});

Handlebars.registerHelper("decrement", function(value) {
  return value - 1;
});

Handlebars.registerHelper("range", function(start, end) {
  let rangeArray = [];
  for (let i = start; i <= end; i++) {
    rangeArray.push(i);
  }
  return rangeArray;
});
*/

//-------
// ROUTES
//-------

app.get("/", (req, res) => {
  //console.log("SESSIONS: " + JSON.stringify(request.session));

  const model = {
    isLoggedIn: req.session.isLoggedIn,
    name: req.session.name,
    isAdmin: req.session.isAdmin,
  };
  res.render("home.handlebars", model);
});

app.get("/about", (req, res) => {
  res.render("about", {
    group: group_info,
    members: members,
  });
});

app.get("/music", (req, res) => {
  res.render("music", {
    albums: albums, // 直接使用内存中的数据
  });
});

app.get("/imprints", (req, res) => {
  // 获取分页参数，默认为第一页
  const locationsPage = parseInt(req.query.locationsPage) || 1;
  const outfitsPage = parseInt(req.query.outfitsPage) || 1;
  const foodsPage = parseInt(req.query.foodsPage) || 1;

  const itemsPerPage = 3;

  const locationsOffset = (locationsPage - 1) * itemsPerPage;
  const outfitsOffset = (outfitsPage - 1) * itemsPerPage;
  const foodsOffset = (foodsPage - 1) * itemsPerPage;

  const locationsQuery = "SELECT * FROM locations LIMIT ? OFFSET ?";
  const outfitsQuery = "SELECT * FROM outfits LIMIT ? OFFSET ?";
  //const foodsQuery = "SELECT * FROM foods LIMIT ? OFFSET ?"; //原代码 如果下行运行报错请恢复这行 目前下一行正常运行 TT
  const foodsQuery = `
        SELECT foods.id, foods.name, foods.brand, foods.price, members.name AS recommended_by
        FROM foods
        INNER JOIN members ON foods.recommended_by = members.id
        LIMIT ? OFFSET ?`;

  const locationsCountQuery = "SELECT COUNT(*) AS count FROM locations";
  const outfitsCountQuery = "SELECT COUNT(*) AS count FROM outfits";
  const foodsCountQuery = "SELECT COUNT(*) AS count FROM foods";

  db.get(locationsCountQuery, (err, locationsCountResult) => {
    const totalLocationsPages = Math.ceil(
      locationsCountResult.count / itemsPerPage
    );

    db.get(outfitsCountQuery, (err, outfitsCountResult) => {
      const totalOutfitsPages = Math.ceil(
        outfitsCountResult.count / itemsPerPage
      );

      db.get(foodsCountQuery, (err, foodsCountResult) => {
        const totalFoodsPages = Math.ceil(
          foodsCountResult.count / itemsPerPage //有报错 有可能是导致无法关联外键的原因
        );

        db.all(
          locationsQuery,
          [itemsPerPage, locationsOffset],
          (err, locationRows) => {
            if (err)
              return res.status(500).send("Error retrieving locations data.");

            db.all(
              outfitsQuery,
              [itemsPerPage, outfitsOffset],
              (err, outfitRows) => {
                if (err)
                  return res.status(500).send("Error retrieving outfits data.");

                db.all(
                  foodsQuery,
                  [itemsPerPage, foodsOffset],
                  (err, foodRows) => {
                    if (err)
                      return res
                        .status(500)
                        .send("Error retrieving foods data.");

                        console.log("Food Rows:", foodRows);  
                    // 渲染页面，传递所有分页参数
                    res.render("imprints", {
                      locations: locationRows,
                      outfits: outfitRows,
                      foods: foodRows,
                      locationsCurrentPage: locationsPage,
                      outfitsCurrentPage: outfitsPage,
                      foodsCurrentPage: foodsPage,
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

app.get("/locations", (req, res) => {
  const locationsPage = parseInt(req.query.locationsPage) || 1;
  const outfitsPage = parseInt(req.query.outfitsPage) || 1;
  const foodsPage = parseInt(req.query.foodsPage) || 1;

  const itemsPerPage = 3;
  const offset = (locationsPage - 1) * itemsPerPage;

  const query = "SELECT * FROM locations LIMIT ? OFFSET ?";
  const countQuery = "SELECT COUNT(*) AS count FROM locations";

  db.get(countQuery, (err, result) => {
    if (err) {
      console.error("Error retrieving locations count:", err.message);
      res.status(500).send("Error retrieving locations count.");
    } else {
      const totalLocationsPages = Math.ceil(result.count / itemsPerPage);

      db.all(query, [itemsPerPage, offset], (err, rows) => {
        if (err) {
          console.error(err.message);
          res.status(500).send("Error retrieving locations data.");
        } else {
          res.render("locations", {
            locations: rows,
            locationsCurrentPage: locationsPage,
            outfitsCurrentPage: outfitsPage, // 保留 outfits 的分页状态
            foodsCurrentPage: foodsPage, // 保留 foods 的分页状态
            totalLocationsPages: totalLocationsPages,
          });
        }
      });
    }
  });
});

/*
app.get("/outfits", (req, res) => {
  const query = "SELECT * FROM outfits"; // 查询 outfits 表的所有数据
  db.all(query, [], (err, rows) => {
    // 运行 SQL 查询
    if (err) {
      console.error("Error retrieving outfits:", err.message);
      res.status(500).send("Error retrieving outfits.");
    } else {
      console.log(rows); // 调试时检查是否获取到了正确的数据
      res.render("outfits", { outfits: rows }); // 渲染模板并传递数据
    }
  });
});
*/

// 修改后的 foods 查询
const query = "SELECT id, name, brand, price FROM foods LIMIT ? OFFSET ?";
const countQuery = "SELECT COUNT(*) AS count FROM foods"; // 这个仍然保留


app.get("/outfits", (req, res) => {
  const outfitsPage = parseInt(req.query.outfitsPage) || 1;
  const locationsPage = parseInt(req.query.locationsPage) || 1;
  const foodsPage = parseInt(req.query.foodsPage) || 1;

  const itemsPerPage = 3;
  const offset = (outfitsPage - 1) * itemsPerPage;

  const query = "SELECT * FROM outfits LIMIT ? OFFSET ?";
  const countQuery = "SELECT COUNT(*) AS count FROM outfits";

  db.get(countQuery, (err, result) => {
    if (err) {
      console.error("Error retrieving outfits count:", err.message);
      res.status(500).send("Error retrieving outfits count.");
    } else {
      const totalOutfitsPages = Math.ceil(result.count / itemsPerPage);

      db.all(query, [itemsPerPage, offset], (err, rows) => {
        if (err) {
          console.error(err.message);
          res.status(500).send("Error retrieving outfits data.");
        } else {
          res.render("outfits", {
            outfits: rows,
            outfitsCurrentPage: outfitsPage,
            locationsCurrentPage: locationsPage, // 保留 locations 的分页状态
            foodsCurrentPage: foodsPage, // 保留 foods 的分页状态
            totalOutfitsPages: totalOutfitsPages,
          });
        }
      });
    }
  });
});

app.get("/foods", (req, res) => {
  const foodsPage = parseInt(req.query.foodsPage) || 1;
  const locationsPage = parseInt(req.query.locationsPage) || 1;
  const outfitsPage = parseInt(req.query.outfitsPage) || 1;

  const itemsPerPage = 3;
  const offset = (foodsPage - 1) * itemsPerPage;

  // 使用 INNER JOIN 获取推荐者的名字
  //const query = `
    //SELECT foods.id, foods.name, foods.brand, foods.price, members.name AS recommended_by
    //FROM foods
    //INNER JOIN members ON foods.recommended_by = members.id
    //LIMIT ? OFFSET ?`;

  //const countQuery = "SELECT COUNT(*) AS count FROM foods";

  db.get(countQuery, (err, result) => {
    if (err) {
      console.error("Error retrieving foods count:", err.message);
      res.status(500).send("Error retrieving foods count.");
    } else {
      const totalFoodsPages = Math.ceil(result.count / itemsPerPage);

      db.all(query, [itemsPerPage, offset], (err, rows) => {
        if (err) {
          console.error("Error retrieving foods data:", err.message);
          res.status(500).send("Error retrieving foods data.");
        } else {
          // 确保正确传递数据到模板

          res.render("foods", {
            foods: rows, // 传递 foods 列表，其中包含推荐者的名字
            foodsCurrentPage: foodsPage,
            locationsCurrentPage: locationsPage, // 保留 locations 的分页状态
            outfitsCurrentPage: outfitsPage, // 保留 outfits 的分页状态
            totalFoodsPages: totalFoodsPages,
          });
        }
      });
    }
  });
});

app.get("/events", (req, res) => {
  const page = parseInt(req.query.page) || 1; // 当前页码，默认第一页
  const itemsPerPage = 3; // 每页显示的项目数
  const offset = (page - 1) * itemsPerPage; // 计算 OFFSET

  // 查询总 events 数量，获取总页数
  db.get("SELECT COUNT(*) AS count FROM events", (err, result) => {
    if (err) {
      return res.status(500).send("Error retrieving events count.");
    }

    const totalEvents = result.count;
    const totalPages = Math.ceil(totalEvents / itemsPerPage); // 计算总页数

    // 查询当前页的 events 数据
    const query = `SELECT * FROM events LIMIT ? OFFSET ?`;
    db.all(query, [itemsPerPage, offset], (err, rows) => {
      if (err) {
        return res.status(500).send("Error retrieving events.");
      }

      // 渲染页面并传递分页和事件数据
      res.render("events", {
        events: rows, // 当前页的 events 数据
        currentPage: page, // 当前页码
        totalPages: totalPages, // 总页数
      });
    });
  });
});

app.get("/contact", (req, res) => {
  res.render("contact.handlebars");
});

app.post("/submit-contact", (req, res) => {
  const { name, email, message } = req.body;
  console.log(`Contact Form Submission: ${name}, ${email}, ${message}`);
  //req.session.successMessage = "Your message has been sent successfully!";
  res.redirect("/"); // Redirect back to the home page or thank you page
});

app.get("/login", (req, res) => {
  const successMessage = req.session.successMessage; // 获取成功消息
  delete req.session.successMessage;
  const errorMessage = req.session.errorMessage; // 获取错误消息
  delete req.session.errorMessage;
  res.render("login.handlebars", { success: successMessage, error: errorMessage });
});

/*
app.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  let model = {};

  //console.log("The login is the admin one!");


    if (password === theAdminPassword) {
      console.log("The password is the admin one!");

      // SESSIONS
      req.session.isAdmin = true;
      req.session.isLoggedIn = true;
      req.session.name = username;

      const successMessage = "Log in successfully. Welcome back!";
      model.success = successMessage;

      res.render("login.handlebars", model);
    } else {
      const errorMessage = "The password is NOT the admin one!";
      model.error = errorMessage;
      res.render("login.handlebars", model);
    }
  } else {
    const errorMessage = "This account doesn't exist!";
    model.error = errorMessage;
    res.render("login.handlebars", model);




  if (username === theAdminLogin) {
    bcrypt.compare(password, theAdminPassword, (err, isMatch) => {
      if (err) {
        console.error("Error comparing password:", err);
        model.error = "An error occurred during login.";
        res.render("login.handlebars", model);
      } else if (isMatch) {
        //console.log('the password is the admin one'); //worked well

        req.session.isAdmin = true;
        req.session.isLoggedIn = true;
        req.session.name = username;

        res.redirect("/");

        //console.log("Session information: "+JSON.stringify(req.session));

        //model.success = "Log in successfully. Welcome back!";
        //res.render("login.handlebars", model);
      } else {
        model.error = "The password is incorrect!";
        res.render("login.handlebars", model);
      }
    });
  } else {
    model.error = "This account doesn't exist!";
    res.render("login.handlebars", model);
  }
});

*/



app.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  // 查询用户的哈希密码
  db.get('SELECT password FROM users WHERE username = ?', [username], (err, row) => {
      if (err) {
          console.error("An error occurred while querying the user:", err);
          return res.status(500).send('Query failed');
      }

      if (row) {
          // 用户存在，比较密码
          bcrypt.compare(password, row.password, (err, isMatch) => {
              if (err) {
                  console.error("An error occurred while comparing password:", err);
                  return res.status(500).send('An error occurred while comparing password');
              }
              if (isMatch) {
                  // 密码匹配
                  req.session.isLoggedIn = true;
                  req.session.name = username;

                  res.redirect("/"); // 登录成功后重定向
              } else {
                  // 密码不匹配
                  req.session.errorMessage = "The password is not correct";
                  res.redirect("/login"); // 重定向回登录页面
              }
          });
      } else {
          // 用户不存在
          req.session.errorMessage = "This account does not exist";
          res.redirect("/login"); // 重定向回登录页面
      }
  });
});

app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
      if (err) {
          console.error("Error logging out:", err);
      }
      res.redirect("/"); // 登出后重定向到首页
  });
});

// 显示注册页面
app.get("/register", (req, res) => {
  const errorMessage = req.query.error || ''; // 获取查询参数中的错误信息
  res.render("register.handlebars", { errorMessage }); // 将错误信息传递到模板
});

app.post("/register", (req, res) => {
  const { username, email, password } = req.body; // 获取用户名、邮箱和密码
  const hashedPassword = bcrypt.hashSync(password, saltRounds); // 哈希密码

  // 邮箱格式验证
  const emailPattern = /\S+@\S+\.\S+/; // 简单的邮箱格式正则表达式
  if (!emailPattern.test(email)) {
      const errorMessage = 'Invalid email format'; // 邮箱格式错误的提示
      return res.redirect(`/register?error=${encodeURIComponent(errorMessage)}`);
  }

  // 查询数据库，检查用户名和邮箱是否已存在
  db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, email], (err, row) => {
      if (err) {
          console.error('Database query error:', err); // 输出详细的错误信息
          const errorMessage = 'Database error, please try again later.';
          return res.redirect(`/register?error=${encodeURIComponent(errorMessage)}`);
      }

      // 如果 row 不为空，表示用户名或邮箱已存在
      if (row) {
          const errorMessage = 'Username or email already exists'; // 用户名或邮箱已存在的错误信息
          return res.redirect(`/register?error=${encodeURIComponent(errorMessage)}`);
      }

      // 用户名和邮箱都不重复，插入新用户
      db.run(
          'INSERT INTO users (username, email, password) VALUES (?, ?, ?)', 
          [username, email, hashedPassword],
          function(err) {
              if (err) {
                  console.error('Insert error:', err); // 输出插入错误的详细信息
                  const errorMessage = 'Registration failed, please try again'; // 其他错误信息
                  return res.redirect(`/register?error=${encodeURIComponent(errorMessage)}`);
              }
              res.redirect('/login'); 
          }
      );
  });
});


// 显示个人信息页面
app.get("/profile", (req, res) => {
  if (!req.session.isLoggedIn) {
      return res.redirect("/login"); // 如果用户未登录，则重定向到登录页面
  }

  const username = req.session.name; // 获取当前用户名
  db.get('SELECT id, username FROM users WHERE username = ?', [username], (err, row) => {
      if (err) {
          return res.status(500).send('查询失败');
      }
      res.render('profile.handlebars', { user: row }); // 创建 profile.handlebars 模板
  });
});


app.post("/profile/update", (req, res) => {
  const { newUsername, password } = req.body; // 获取新的用户名和密码
  const currentUsername = req.session.name; // 获取当前用户的用户名

  // 检查是否有新用户名或新密码
  if (!newUsername && !password) {
      return res.status(400).send('请提供新的用户名或密码'); // 如果两者都为空，返回错误
  }

  // 初始化更新查询和参数
  let query = 'UPDATE users SET';
  const params = [];

  // 添加新的用户名到查询和参数
  if (newUsername) {
      query += ' username = ?';
      params.push(newUsername);
  }

  // 添加新的密码到查询和参数
  if (password) {
      const hashedPassword = bcrypt.hashSync(password, saltRounds); // 哈希密码
      if (params.length > 0) {
          query += ','; // 如果已经有其他字段，需要添加逗号分隔
      }
      query += ' password = ?';
      params.push(hashedPassword);
  }

  query += ' WHERE username = ?'; // 添加条件
  params.push(currentUsername); // 当前用户名

  console.log('SQL Query:', query); // 输出 SQL 查询以便调试
  console.log('Parameters:', params); // 输出参数以便调试

  // 执行更新查询
  db.run(query, params, function(err) {
      if (err) {
          console.error('Update error:', err); // 记录错误信息以便调试
          return res.status(400).send('更新失败， 请重试。'); // 一般化错误消息
      }
      req.session.name = newUsername || currentUsername; // 更新会话中的用户名
      res.redirect("/profile"); // 更新成功后重定向回个人信息页面
  });
});


app.post("/profile/delete", (req, res) => {
  const currentUsername = req.session.name; // 获取当前用户的用户名

  db.run('DELETE FROM users WHERE username = ?', [currentUsername], (err) => {
      if (err) {
          console.error('删除失败:', err); // 记录错误信息以便调试
          return res.status(400).send('删除失败，请重试。'); // 返回一般化的错误消息
      }
      req.session.destroy((err) => { // 注销会话
          if (err) {
              console.error("注销失败:", err);
          }
          res.redirect("/"); // 删除成功后重定向到首页
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
  // 清空现有数据，确保顺序插入
  db.run("DELETE FROM group_info", (err) => {
    if (err) {
      console.error(err.message);
    } else {
      // Insert each group info into the database
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
  // 清空现有数据，确保顺序插入
  db.run("DELETE FROM members", (err) => {
    if (err) {
      console.error(err.message);
    }
    // Insert members into the database
    members.forEach((member) => {
      db.run(
        `INSERT INTO members (name, birthday, mbti, zodiac_sign, blood_type, image) VALUES (?, ?, ?, ?, ?, ?)`,
        [
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

// Function to initialize the albums table with data
function initializeAlbumsData() {
  // 清空现有数据，确保顺序插入
  db.run("DELETE FROM albums", (err) => {
    if (err) {
      console.error(err.message);
    }
    // Insert albums into the database
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
  db.run("DELETE FROM locations", (err) => {
    if (err) {
      console.error(err.message);
    }
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
  db.run("DELETE FROM outfits", (err) => {
    if (err) {
      console.error(err.message);
    }

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
  db.run("DELETE FROM foods", (err) => {
    if (err) {
      console.error(err.message);
    }
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
  db.run("DELETE FROM events", (err) => {
    if (err) {
      console.error(err.message);
    }

    events.forEach((event) => {
      db.run(
        `INSERT INTO events (concert_date, country, place) VALUES (?, ?, ?)`,
        [event.concert_date, event.country, event.place],
        (err) => {
          if (err) {
            console.error(err.message);
          }
        }
      );
    });
  });
}
