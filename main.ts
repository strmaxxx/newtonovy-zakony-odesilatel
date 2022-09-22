namespace NewtonovyZakony{

    //% block="Spustí odeílatele skupina_rádia: %radioGroup, Osa_akcelerometru: %dimension, popis_hodnoty: %popis_hodnoty, rychlost_motoru: %rychlost_motoru, Pauza_mezi_merenimi(ms): %t_pause, Počet hodnot v klouzavém průměru: %avg_count, Rozsah měřených hodnot: %range"
    export function spustOdesilatele(radioGroup: number, dimension: Dimension, popis_hodnoty:string, rychlost_motoru:number, t_pause?: number, avg_count?: number, range?: AcceleratorRange){

        let prubezna_hodnota = 0;
        let hodnota_zrychleni = 0;
        let index = 0
        let pole_hodnot: any[] = [];
        let posledni_hodnota = 0;

        if (!range) range = AcceleratorRange.OneG;
        if (!t_pause) t_pause = 50;

        radio.setGroup(radioGroup);
        input.setAccelerometerRange(range)

        control.inBackground(function(){

            while (true) {

                let hodnota = input.acceleration(dimension)
                //if (Math.abs(hodnota - posledni_hodnota) < 10) hodnota = posledni_hodnota;

                posledni_hodnota = hodnota;


                if(false){ // klouzavý průměr

                    pole_hodnot[index] = hodnota;

                    if (index >= avg_count) index = 0;

                    let suma = 0
                    for (let i = 0; i < pole_hodnot.length; i++) suma += pole_hodnot[i]
                    hodnota_zrychleni = suma / pole_hodnot.length;

                }else if(false){ // lowpass

                    pole_hodnot[index] = hodnota;

                    if (index < avg_count) index++;
                    else pole_hodnot.shift();

                    let smoothing = 10; // koeficient vyhlazení

                    let value = pole_hodnot[0]; // start with the first input
                    for (let j = 1, len = pole_hodnot.length; j < len; j++) {
                        value += (pole_hodnot[j] - value) / smoothing;
                    }

                    hodnota_zrychleni = value;
                }else{

                    //let smoothing = 10; // koeficient vyhlazení = avg_count
                    prubezna_hodnota += (hodnota - prubezna_hodnota) / avg_count;
                    hodnota_zrychleni = prubezna_hodnota;
                    
                }
                pause(10);
            }
        });

        let buffer: any[] = [];
        let buffer_index = 0;


        control.inBackground(function () {
            while (true) {

                buffer[buffer_index] = Math.round(hodnota_zrychleni);
                if (buffer_index < 3) buffer_index++;
                else buffer.shift();

                pause(t_pause / 3);
            }
        })

        control.inBackground(function () {
            while (true) {

                let text = "";
                for (let k = 0; k < buffer.length; k++){

                    if (text != '') text += ';'; 
                    text += buffer[k];
                     
                }

                radio.sendString(popis_hodnoty + ":" + text)
                //serial.writeLine(popis_hodnoty + ":" + suma / pole_hodnot.length)
                pause(t_pause);
            }
        })
        
        radio.onReceivedString(function(receivedString: string) {
            
            if (receivedString == 'GOGO'){

                wuKong.setAllMotor(rychlost_motoru, rychlost_motoru);
                /*
                for(let k = 10; k > 0; k--){

                    wuKong.setAllMotor(rychlost_motoru/k, rychlost_motoru/k);
                    pause(20);
                }
                */

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
            if(receivedString.includes(';')){

                let data = receivedString.split(';');
                let popis = data[0].substr(0, data[0].indexOf(':')+1);

                serial.writeLine(data[0]);
                pause(10);

                for (let l = 1; l < data.length; l++){
                    serial.writeLine(popis + data[l]);
                    pause(10);
                }

            }else{


                serial.writeLine(receivedString)
            }
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
