
function Bullet() {
    var defaultPosition = new THREE.Vector3(0, -20, 0);
    var defaultDirection = new THREE.Vector3(0, 0, 0);

    var axis = new THREE.Vector3(0, 1, 0);

    this.direction = defaultDirection;
    this.speed = 0;
    this.active = false;
    this.shotByPlayer = false;

    var mat = new THREE.MeshPhongMaterial( {emissive: colorWhite} );
    var trailMat = new THREE.MeshPhongMaterial( {color: colorSecondary,emissive: colorSecondary}); //, transparent:true, opacity:0.5} );
    
    var bulletSize = 0.02;
    var trailSize = 4;
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(bulletSize, 4, 4), mat);
    this.trail = new THREE.Mesh(new THREE.CylinderGeometry(bulletSize, 0 , trailSize, 3 ), trailMat);
    this.mesh.add(this.trail);

    this.mesh.position.set(defaultPosition);
    game.scene.add(this.mesh);

    this.farDetection = 1;
    this.raycaster = new THREE.Raycaster(new THREE.Vector3(),new THREE.Vector3(),0,this.farDetection);
    this.objectToCollide = [];
    //adicinar objetos para colidir estaticos AQUI! dinamicos (enimigos deve ser na func active)
    this.objectToCollide.push(game.floors);
    this.objectToCollide.push(game.walls);

    //this.box = new THREE.Mesh(new THREE.BoxGeometry(0.5,0.5,0.5),new THREE.MeshBasicMaterial({color:0x00ff00}));
    //this.box.position.set(this.mesh.position);
    //game.scene.add(this.box);
    //this.objectToCollide.push(game.walls.children);
    //this.objectToCollide.push(game.floors.children);


    var self = this;    
    
    this.setPosition = function(position) {
        this.mesh.position.copy(position);
    };

    this.update = function (delta, objectIndex) {
        //this.box.position.copy(new THREE.Vector3().addVectors(this.mesh.position,this.direction.normalize()));
        //console.log(this.mesh.position);
        this.raycaster.ray.origin.copy(this.mesh.position);
        this.raycaster.ray.direction.copy(this.direction);

        var intersections = this.raycaster.intersectObjects(this.objectToCollide,true);
        //var intersection = this.raycaster.intersectObject(game.enemies[0].mesh,true);

        if (intersections.length>0){
            console.log("Colisão bala");
            var object = getParent(intersections[0].object);
            if (object.name=="enemy"){//bala colidiu com inimigo
                console.log("Com enimgo");

            }//se nao colidiu com parede ou chao

            this.destroy(objectIndex);
            return;
        }


        if ( outsideMap(this.mesh.position) ){
            this.destroy(objectIndex);
            return ;
        }

        this.mesh.translateOnAxis( this.direction, this.speed * delta * game.currentTimeSpeed);
    };

    this.activate = function (position, direction, speed, shotByPlayer) {
        this.setPosition(position);
        this.direction = direction.normalize(); //IMP normalizar
        this.speed = speed;
        this.active = true;
        this.shotByPlayer = shotByPlayer;
        
        game.bullets.push(this);
        
        this.trail.quaternion.setFromUnitVectors(axis, direction);  // rotação do trail
        // posição do trail atraz da bala
        this.trail.position.x = - direction.x * trailSize / 2;
        this.trail.position.y = - direction.y * trailSize / 2;
        this.trail.position.z = - direction.z * trailSize / 2;

        //adicionar enimigos ativos para colisoes
        for (var i = 0;i<game.enemies.length;i++)
            this.objectToCollide.push(game.enemies[0].mesh)// não dá para utilizar função de map do js
    };

    this.destroy = function(index){
        game.bullets.splice(index,1); //remover dos objetos ativos
        bPool.free(this);
        this.setPosition(defaultPosition);
        this.direction = defaultDirection;

    };
}

function getParent(object) {
    if (object.name=="") return getParent(object.parent);
    return object;
}

function BulletPool() {
    this.totalPooled = 0;
    this.totalUsed = 0;

    var pool = [];

    // função interna
    this.createBullet = function() {
        var bullet = new Bullet();
        pool.push(bullet);
        this.totalPooled += 1;
        return bullet;
    };

    this.init = function(number) {
        for (var i=0; i<number; i++){
            this.createBullet();
        }
    };

    this.allocate = function() {
        var bullet;
        // se está a usar todas as balas que existem tem de criar uma nova
        if (this.totalUsed === this.totalPooled) {
            bullet = this.createBullet();
        } else {
            bullet = pool.pop();
            this.totalUsed += 1;
        }
        return bullet;
    };

    this.free = function(bullet) {
        if (!bullet.active) return;

        bullet.active = false;
        pool.push(bullet);
        this.totalUsed -= 1;
    };
}