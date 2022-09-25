namespace NewtonovyZakony {
    /**
     * Každých 5 ms změří hodnotu z akcelerometru a filtruje ji dolnopropustným filtrem.
     * Každých t_pause/5 ms (25 ms) ukládá aktuální hodnotu do bufferu, který obsahuje 5 hodnot.
     * Každých t_pause ms (125 ms) odešle buffer s popisem hodnot rádiem.
     * Rádiem lze odeslat maximálně 19 bajtů. 5 čísel = 10 bajtů + 9 bajtů na popis hodnoty ASCII znaky
     */

    const pocet_cisel = 5;
    const t_pause = 125;

    //% block="Spustí měření a odesílání dat a inicializuje motory, skupina_rádia: %radioGroup, Osa_akcelerometru: %dimension, popis_hodnoty (Maximálně 9 ASCII znaků): %popis_hodnoty, rychlost_motoru: %rychlost_motoru, Rozsah měřených hodnot: %range"
    export function spustOdesilatele(radioGroup: number, dimension: Dimension, popis_hodnoty:string, rychlost_motoru?:number, range?: AcceleratorRange){

        let prubezna_hodnota = 0;
        let hodnota_zrychleni = 0;

        if (!range) range = AcceleratorRange.OneG;
        if (!rychlost_motoru) rychlost_motoru = 100;

        radio.setGroup(radioGroup);
        input.setAccelerometerRange(range);

        control.inBackground(function(){

            while (true) {

                let hodnota = input.acceleration(dimension)

                // volba filtru
                if(true){
                    
                    prubezna_hodnota = prubezna_hodnota * 0.9 + hodnota*0.1;
                    hodnota_zrychleni = prubezna_hodnota;
                }else{

                    prubezna_hodnota += (hodnota - prubezna_hodnota) / 10;
                    hodnota_zrychleni = prubezna_hodnota;
                }
                pause(5);
            }
        });

        let buffer: any[] = [];
        let buffer_index = 0;
        for (let i = 0; i < pocet_cisel; i++) buffer.push(0);

        control.inBackground(function () {
            while (true) {

                buffer[buffer_index] = Math.round(hodnota_zrychleni);
                if (buffer_index < pocet_cisel) buffer_index++;
                else buffer.shift();

                pause(t_pause / pocet_cisel);
            }
        })

        control.inBackground(function () {
            while (true) {

                let buf = pins.createBuffer(pocet_cisel*2 + popis_hodnoty.length)

                for (let j = 0; j < pocet_cisel; j++){

                    buf.setNumber(NumberFormat.Int16LE, j * 2, buffer[j])
                }

                for (let k = 0; k < popis_hodnoty.length; k++) {

                    buf.setNumber(NumberFormat.Int8LE, pocet_cisel*2+k, popis_hodnoty.charCodeAt(k));
                }

                radio.sendBuffer(buf);
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

    //% block="Spustí příjemce a ovladač motorů. skupina_rádia: %radioGroup"
    export function spustPrijemce(radioGroup: number){

        let prijato = false;

        radio.onReceivedBuffer(function (receivedBuffer) {

            let popis = '';
            for (let l = pocet_cisel * 2; l < receivedBuffer.length; l++) {

                popis += String.fromCharCode(receivedBuffer.getNumber(NumberFormat.Int8LE, l));
            }
            for (let m = 0; m < pocet_cisel; m++) {

                serial.writeLine(popis + ':' + receivedBuffer.getNumber(NumberFormat.Int16LE, m * 2));
                pause(t_pause/5-1);
            }

            prijato = true;
        });

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
