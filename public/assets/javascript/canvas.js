// const _ = require("underscore")
const canvas = document.querySelector(`canvas`)
const context = canvas.getContext(`2d`)

// Indicates the dimensions of the play field
canvas.width = 1280
canvas.height = 768

// Applies the dimension
context.fillRect(0, 0, canvas.width, canvas.height)
const placementTilesData2D = []

//every 40 units of the placementTilesData array make a new array so we can have a grid like structure
for (let i = 0; i < placementTilesData.length; i+= 40){
    placementTilesData2D.push(placementTilesData.slice(i, i + 40))
}

const placementTiles = []

//for each row if there is a symbol of 961 in the placementiledata array then be able to place building
// y indicates the number of rows
placementTilesData2D.forEach((row , y) => {
    row.forEach((symbol , x) => {
        if (symbol === 961) {
            placementTiles.push(
                new PlacementTile({
                position: {
                    //indicates which column its on
                    x: x * 32,
                    //indicates which row its on
                    y: y * 32
                }
            }))
        }
    })
})

const map1 = new Image()
// what to do when the image loads
map1.onload = () =>{
    context.drawImage(map1 , 0 , 0)
}
map1.src = `assets/Img/Gamemap.png`
// creates an enemy on a specific start point by x and y
//pushes a new enemy in the enemy array
const enemies = []

function spawnEnemies(enemyCount) {
    for (let i = 1; i < 5 + enemyCount; i++) {
        //offsets the position of the enemy behind older enemy
        const xOffset = i * 50
       if (i < 15 ) {
        enemies.push(new Enemy({
            position: {x: waypoints[0].x - xOffset, y: waypoints[0].y }
        }))
       } else if (i >= 15 && i < 25) {
        enemies.push(new Speedster({
            position: {x: waypoints[0].x - xOffset, y: waypoints[0].y }
        }))
        enemies.push(new Enemy({
            position: {x: waypoints[0].x - xOffset, y: waypoints[0].y }
        }))
       } else {
        enemies.push(new Enemy({
            position: {x: waypoints[0].x - xOffset, y: waypoints[0].y }
        }))
        enemies.push(new Speedster({
            position: {x: waypoints[0].x - xOffset, y: waypoints[0].y }
        }))
        enemies.push(new Tank({
            position: {x: waypoints[0].x - xOffset, y: waypoints[0].y }
        }))
       }
    }
}
let waveToken = 1

const buildings = []
let activeTile = undefined
let hearts = 10
let money = 100
const explosions = []
spawnEnemies(waveToken)

// infinite loop that keeps repeating to update the enemy position
function animate() {
    const animationId = requestAnimationFrame(animate)
// draws new image on loop
    context.drawImage(map1, 0 , 0)

for (let i = enemies.length - 1; i >= 0; i--){
    const enemy = enemies[i]
    enemy.update()

    if (enemy.position.x > canvas.width) {
        hearts -= 1
        enemies.splice(i , 1)
        //decrease the text to match the heart variable
        document.querySelector(`#hearts`).innerHTML = `<span>&#128151;</span>${hearts}`

        if (hearts === 0) {
            //cancel all animations
            cancelAnimationFrame(animationId)
            // display hidden gameover text from the style sheet
            document.querySelector(`#gameOver`).style.display = `flex`
        } 
    }
}
    for (let i = explosions.length - 1; i >= 0; i--){
        const explosion = explosions[i]
        explosion.draw()
        explosion.update()

        if(explosion.frames.current >= explosion.frames.x -1) {
            explosions.splice(i, 1)
        }
    }
    //determines after enemies are gone then spawn more enemies and increase counter
    if (enemies.length === 0) {
        waveToken++
        spawnEnemies(waveToken)
        waveToken++
        spawnEnemies(waveToken)
    }


    placementTiles.forEach((tile) =>{
        tile.update(mouse)
    })
    // draws the building upon clicking
    buildings.forEach((building) => {
        building.update()
        building.target = null
        //detects if there is an enemy within the radius
        const validEnemies = enemies.filter(enemy => {
            const xDifference = enemy.position.x - building.center.x
            const yDifference = enemy.position.y - building.center.y
            const distance = Math.hypot(xDifference, yDifference)
            return distance < enemy.radius + building.radius
        })
        building.target = validEnemies[0]

        for (let i = building.projectiles.length - 1; i >= 0; i--){
            const projectile = building.projectiles[i]
        
            projectile.update()

            //tracks the distance between the projectile to the enemy position
            const xDifference = projectile.enemy.position.x - projectile.position.x
            const yDifference = projectile.enemy.position.y - projectile.position.y
            const distance = Math.hypot(xDifference, yDifference)
            //removes the enemy and calculates damage
            if (distance < projectile.enemy.radius + projectile.radius){
                projectile.enemy.health -= building.damage
                if(projectile.enemy.health <= 0) {
                    const enemyIndex = enemies.findIndex((enemy) => {
                        return projectile.enemy === enemy
                    })
                    //makes sure that random enemies arent removed before the projectile hits
                    if (enemyIndex > -1) {
                        enemies.splice(enemyIndex, 1)
                        money+= 25
                        document.querySelector(`#money`).innerHTML = `<i class="fa fa-money" aria-hidden="true"></i>${money}`
                    }
                }
                //removes the projectile
                explosions.push(
                    new Sprite({
                        position: {x: projectile.position.x,  y: projectile.position.y}, 
                        imgSrc: `assets/img/explosion.png`,
                        frames: {x : 4}
                      }
                ))
                building.projectiles.splice(i, 1)
            }
        }
    })
}

const mouse = {
    x: undefined,
    y: undefined
}

canvas.addEventListener(`click`, (event) => {
    //build if not occupied and if have more than 50 cash
    if(activeTile && !activeTile.isOccupied && money - 50 >= 0){
        money -= 50
        document.querySelector(`#money`).innerHTML = `<i class="fa fa-money" aria-hidden="true"></i>${money}`
        buildings.push(new Building({
            position:{
                x: activeTile.position.x,
                y: activeTile.position.y
            }
        })
        )
        //the tile that we are on is now occupied therefor no new buildings can be placed
        activeTile.isOccupied = true
    }
})

//mouse coordinates is where the clients moves its mouse over
window.addEventListener(`mousemove` , (event)=>{
    mouse.x = event.clientX
    mouse.y = event.clientY

    //if not selecting a tile that can be built open it will return null if not then can place a building
    activeTile = null
    for (let i = 0; i < placementTiles.length; i++){
        const tile = placementTiles[i]
        if(
            mouse.x > tile.position.x &&
            mouse.x < tile.position.x + tile.size && 
            mouse.y > tile.position.y && 
            mouse.y < tile.position.y + tile.size
            ){
            activeTile = tile
            break
        }
    }
})
window.addEventListener(`hover` , (event)=>{
    context.beginPath()
    context.arc(this.center.x, this.center.y, this.radius, 0, Math.PI * 2)
    context.fillStyle = `rgba(255, 255, 255 , .05)`
    context.fill()
})
animate()
