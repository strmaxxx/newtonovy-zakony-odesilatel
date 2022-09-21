namespace NewtonovyZakony{

    //% block="Spustí odeílatele skupina_rádia: %radioGroup, Osa_akcelerometru: %dimension, popis_hodnoty: %popis_hodnoty, rychlost_motoru: %rychlost_motoru, Pauza_mezi_merenimi(ms): %t_pause, Počet hodnot v klouzavém průměru: %avg_count, Rozsah měřených hodnot: %range"
    export function spustOdesilatele(radioGroup: number, dimension: Dimension, popis_hodnoty:string, rychlost_motoru:number, t_pause?: number, avg_count?: number, range?: AcceleratorRange){

        let suma = 0
        let index = 0
        let pole_hodnot: any[] = [];

        if (!range) range = AcceleratorRange.OneG;
        if (!t_pause) t_pause = 50;

        radio.setGroup(radioGroup);
        input.setAccelerometerRange(range)

        control.inBackground(function(){

            while (true) {
                pole_hodnot[index] = input.acceleration(dimension)
                index += 1
                if (index > avg_count) index = 0

                suma = 0
                for (let i = 0; i < pole_hodnot.length; i++) suma += pole_hodnot[i]
                pause(10);
            }
        });
        control.inBackground(function () {
            while (true) {

                radio.sendString(popis_hodnoty + ":" + Math.round(suma / pole_hodnot.length))
                //serial.writeLine(popis_hodnoty + ":" + suma / pole_hodnot.length)
                pause(t_pause);
            }
        })
        
        radio.onReceivedString(function(receivedString: string) {
            
            if (receivedString == 'GOGO'){

                wuKong.setAllMotor(rychlost_motoru, rychlost_motoru);

            }

            if (receivedString == 'STOP') {
                wuKong.setAllMotor(0, 0);
            }
        })

    }

    //% block="Spustí Příjemce a ovladač skupina_rádia: %radioGroup"
    export function spustPrijemce(radioGroup: number){

        let prijato = false;

        radio.onReceivedString(function (receivedString) {
            serial.writeLine(receivedString)
            prijato = true;
        })
        radio.setGroup(radioGroup)
        serial.redirectToUSB()

        control.runInParallel(function () {

            while (true){

                if (prijato){

                    led.plot(0, 0)
                    pause(100);
                    prijato = false;
                }else{

                    led.unplot(0, 0);
                    pause(100);
                }
            }

        });

        
        input.onButtonPressed(Button.A, function () {
            radio.sendString('GOGO');
        })

        input.onButtonPressed(Button.B, function () {
            radio.sendString('STOP');
        })
    }

}
