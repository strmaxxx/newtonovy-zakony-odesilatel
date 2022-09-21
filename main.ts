let suma_z = 0
let index_z = 0
let t_pause = 50
let avg_z_count = 5
let pole_z:any[] = [];



radio.setGroup(10)
input.setAccelerometerRange(AcceleratorRange.OneG)
control.inBackground(function () {
    while (true) {
        pole_z[index_z] = input.acceleration(Dimension.Z)
        index_z += 1
        if (index_z > avg_z_count) {
            index_z = 0
        }
        suma_z = 0
        for (let i = 0; i <= pole_z.length - 1; i++) {
            suma_z += pole_z[i]
        }
        radio.sendString("z:" + Math.round(suma_z / pole_z.length))
        //serial.writeString("z:" + suma_z / pole_z.length)
        pause(t_pause);
    }
})
