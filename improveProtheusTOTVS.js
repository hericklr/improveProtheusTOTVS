/*

improveProtheusTOTVS v1.3.0
https://github.com/hericklr/improveProtheusTOTVS

*/
(

  ()=>
  {

    'use strict';

    const

// ALMOST A JQUERY IMITATION (VERY ULTRA SLIM)

      // RETURNS AN ELEMENT FROM WITHIN THE TARGET FRAME
      $1=
        (rules='')=>
        {
          return document.
            getElementById('mybcontainer_iframe').
            contentDocument.
            getElementById('principal').
            contentDocument.querySelector(rules.trim());
        },

      // RETURNS AN NODELIST FROM WITHIN THE TARGET FRAME
      $n=
        (rules='')=>
        {
          return document.
            getElementById('mybcontainer_iframe').
            contentDocument.
            getElementById('principal').
            contentDocument.querySelectorAll(rules.trim());
        },

// DATE AND TIME SUPPORT FUNCTIONS

      // CONVERTS A DATE TEXT FROM DD/MM/YY FORMAT TO YYYY-MM-DD
      normalizeDate=
        (date='')=>
        {
          if(date==='')
          {
            return '1970-01-01';
          }
          if(date.indexOf('/')>-1)
          {
            date=date.split('/').reverse();
            if(date[0].length===2)
            {
              date[0]=`20${date[0]}`;
            }
            date=date.join('-');
          }
          return date;
        },

      // CONVERTS A TIME TEXT FROM HH:MM FORMAT TO HH:MM:SS
      normalizeTime=
        (time='')=>
        {
          if(time==='')
          {
            return '00:00:00';
          }
          time=time.replace(/\D+/g,'');
          if(time.length!==4)
          {
            return '00:00:00';
          }
          return time.replace(/(\d{2})(\d{2})$/,'$1:$2:00');
        },

      // CONVERTS A TIME TO DATETIME WITH ZERO AS TIMEZONE
      timeToDatetime=
        time=>
        {
          return new Date(`1970-01-01T${time}+0000`);
        },

      // CONVERTS A TIME IN MILLISECONDS TO HH:MM FORMAT
      millisecondsToHourMinute=
        milliseconds=>
        {
          milliseconds=Math.abs(milliseconds);
          let
            seconds=Math.floor(milliseconds/1000),
            minutes=Math.floor(seconds/60),
            hours=Math.floor(minutes/60);
          minutes=minutes%60;
          hours=hours.toString().padStart(2,'0');
          minutes=minutes.toString().padStart(2,'0');
          return `${hours}:${minutes}`;
        },

// PROCEDURE FUNCTIONS (SOUNDS LIKE "PROCEDURE DIVISION" OF COBOL)

      // ADD NEW RULES TO TARGET FRAME CSS
      addNewStyles=
        ()=>
        {
          const
            newStyles=$1('head').appendChild(document.createElement('style'));
          newStyles.innerHTML=
            '#limitesAtuais{display:block;float:left;line-height:1.8rem}'+
            '#limitesAtuais > b{color:inherit;font:inherit;font-weight:bold}'+
            'table tbody tr:hover{background-color:#f3f3f3}'+
            'table tbody tr:nth-child(2n+1):hover{background-color:#ededed}'+
            'table tbody tr td[data-out-of-bounds="1"]{color:#f00}'+
            'table tbody tr td[data-sign="-"]{background-color:rgba(255,0,0,.2)}'+
            'table tbody tr td[data-sign="0"]{background-color:rgba(0,0,0,.12)}'+
            'table tbody tr td[data-sign="+"]{background-color:rgba(0,255,0,.2)}';
        },

      // FILL THE MATRIX WITH THE DATA OF EACH PROCESSED LINE
      populateTimeArray=
        ()=>
        {

          const

            timeColumnPairs=(totalColumns-5)/2;

          let
            dayOfWeek,
            entryTime,
            departureTime,
            totalTime;

          for(let tr of $n('table > tbody > tr'))
          {

            if(tr.rowIndex<2)
            {
              continue;
            }

            totalTime=0;
            for(let i=0;i<timeColumnPairs;++i)
            {
              if(
                tr.children[(2*i)+2].textContent.trim()==='' ||
                tr.children[(2*i)+3].textContent.trim()===''
              )
              {
                continue;
              }
              entryTime=
                timeToDatetime(
                  normalizeTime(tr.children[(2*i)+2].textContent)
                );
              departureTime=
                timeToDatetime(
                  normalizeTime(tr.children[(2*i)+3].textContent)
                );
              totalTime+=departureTime-entryTime;
            }

            if(totalTime===0)
            {
              dayOfWeek=-1;
            }
            else
            {
              dayOfWeek=normalizeDate(tr.children[0].textContent);
              dayOfWeek+='T00:00:00+0000';
              dayOfWeek=new Date(dayOfWeek);
              dayOfWeek=dayOfWeek.getDay();
              totalTime=new Date(totalTime);
            }

            timeGrid.push(
              {
                dayOfWeek,
                totalTime
              }
            );

          }

        },

      // ADD A BUTTON TO CALL THE TIME LIMIT RESET ROUTINE AND THE TWO TAGS THAT WILL DISPLAY THE VALUES
      addVisualControlToAdjustLimits=
        ()=>
        {

          const

            // VALIDATE AND TREAT THE LIMIT TIME FOR WEEKDAYS AND SATURDAYS
            processTime=
              (field='',time='')=>
              {
                field=field.trim();
                if(field==='')
                {
                  return {
                    error: true,
                    message: 'Campo em análise não fornecido'
                  };
                }
                time=time.replace(/[^\d\:]+/g,'');
                if(time.trim()==='')
                {
                  return {
                    error: true,
                    message: `É necessário fornecer o limite de horas para os ${field}`
                  };
                }
                if(time.length>5)
                {
                  time=time.substring(0,4);
                }
                time=time.split(':');
                switch(time.length)
                {
                  case 1:
                    time.push('0');
                    break;
                  case 2:
                    break;
                  default:
                    return {
                      error: true,
                      message: `Limite de horas para ${field} fornecido está em formato incorreto`
                    };
                }
                time=time.map(content=>parseInt(content,10));
                if(time[0]===NaN || time[0]>11)
                {
                  return {
                    error: true,
                    message: `Horas fornecidas para o limite de horas para os ${field} precisa ser de 0 a 11`
                  };
                }
                if(time[1]===NaN || time[1]>59)
                {
                  return {
                    error: true,
                    message: `Minutos fornecidos para o limite de horas para os ${field} precisa ser de 0 a 59`
                  };
                }
                time=
                  time.
                  map(content=>content.toString().padStart(2,'0')).
                  join(':');
                return {
                  error: false,
                  date: `1970-01-01T${time}:00+0000`
                };
              },

            // GET THE TWO NEW BOUNDARIES, UPDATE THE TAGS, SET THE SUMMARY COLUMN COLORS AND SET THE DIFFERENCE COLUMN DATA AND COLORS
            requestNewLimitsAndApply=
              ()=>
              {

                let

                  newWeekdayHoursLimit,

                  newSaturdayHourslimit,

                  tmp;

                newWeekdayHoursLimit=
                  prompt(
                    'Limite de horas para dias de semana (HH:MM)\nMáximo de 11:59',
                    hoursLimit.weekday.toISOString().substring(11,16)
                  );

                if(newWeekdayHoursLimit===null)
                {
                  return;
                }

                newSaturdayHourslimit=
                  prompt(
                    'Limite de horas para sábados (HH:MM)\nMáximo de 11:59',
                    hoursLimit.saturday.toISOString().substring(11,16)
                  );

                if(newSaturdayHourslimit===null)
                {
                  return;
                }

                tmp=
                  processTime(
                    'dias de semana',
                    newWeekdayHoursLimit
                  );
                if(tmp.error)
                {
                  alert(tmp.message);
                  return;
                }
                newWeekdayHoursLimit=tmp.date;

                tmp=
                  processTime(
                    'sábados',
                    newSaturdayHourslimit
                  );
                if(tmp.error)
                {
                  alert(tmp.message);
                  return;
                }
                newSaturdayHourslimit=tmp.date;

                hoursLimit=
                  {
                    weekday: new Date(newWeekdayHoursLimit),
                    saturday: new Date(newSaturdayHourslimit)
                  };

                updateTags();

                setAttrToSumColumn();

                setDataAndAttrToDiffColumn();

              },

            updateTags=
              ()=>
              {
                $1('#limitesAtuais').innerHTML=`Dias de semana: <b>${hoursLimit.weekday.toISOString().substring(11,16)}</b> - Sábados: <b>${hoursLimit.saturday.toISOString().substring(11,16)}</b>`;
              };

          $1('#filterMarks').insertAdjacentHTML(
            'beforeend',
            `<input name="btnAjustaLimites" id="btnAjustaLimites" type="button" value="Ajusta Limites"><div id="limitesAtuais"></div>`
          );

          updateTags();

          $1('#btnAjustaLimites').addEventListener(
            'click',
            requestNewLimitsAndApply
          );

        },

      // CHANGE THE SIZE OF THE TITLE AND ADD TWO NEW COLUMNS (SUMMARY AND DIFFERENCE)
      adjustStructureTable=
        ()=>
        {
          tableTitle.setAttribute('colspan',totalColumns+2);
          for(let tr of $n('table > tbody > tr'))
          {
            switch(tr.rowIndex)
            {
              case 0:
                continue;
              case 1:
                tr.children[totalColumns-4].insertAdjacentHTML('afterend','<th width="30">Total</th><th width="30">Diferença</th>');
                continue;
              default:
                tr.children[totalColumns-4].insertAdjacentHTML('afterend','<td class="info-cent">&nbsp;</td><td class="info-cent">&nbsp;</td>');
                break;
            }
          }
          totalColumns+=2;
        },

      // DEFINES THE SUMMARY OF HOURS WORKED IN THE DAY IN THE SUM COLUMN
      setDataToSumColumn=
        ()=>
        {

          const

            cellPosition=totalColumns-4;

          let

            i=0;

          for(let td of $n(`table > tbody > tr > td:nth-of-type(${cellPosition})`))
          {
            if(td.parentElement.rowIndex<2)
            {
              continue;
            }
            if(timeGrid[i].totalTime===0)
            {
              ++i;
              continue;
            }
            td.innerHTML=millisecondsToHourMinute(timeGrid[i].totalTime);
            ++i;
          }

        },

      // CHANGES THE TEXT COLOR OF CELLS THAT ARE BELOW THE ESTABLISHED LIMITS
      setAttrToSumColumn=
        ()=>
        {

          const

            cellPosition=totalColumns-4;

          let

            i=0,

            dataOutOfBounds;

          for(let td of $n(`table > tbody > tr > td:nth-of-type(${cellPosition})`))
          {
            if(td.parentElement.rowIndex<2)
            {
              continue;
            }
            dataOutOfBounds='0';
            if(
              timeGrid[i].totalTime>0 &&
              (
                (
                  timeGrid[i].dayOfWeek===5 &&
                  timeGrid[i].totalTime<hoursLimit.saturday
                ) ||
                (
                  timeGrid[i].dayOfWeek!==5 &&
                  timeGrid[i].totalTime<hoursLimit.weekday
                )
              )
            )
            {
              dataOutOfBounds='1';
            }
            td.setAttribute('data-out-of-bounds',dataOutOfBounds);
            ++i;
          }
        },

      // DEFINES TEXT AS THE DIFFERENCE BETWEEN HOURS WORKED AND SET LIMITS AND CHANGES CELL COLOR BASED ON INFORMATION
      setDataAndAttrToDiffColumn=
        ()=>
        {

          const

            cellPosition=totalColumns-3;

          let

            i=0,

            difference,

            dataSign;

          for(let td of $n(`table > tbody > tr > td:nth-of-type(${cellPosition})`))
          {
            if(td.parentElement.rowIndex<2)
            {
              continue;
            }
            if(timeGrid[i].totalTime===0)
            {
              td.setAttribute('data-sign','0');
              ++i;
              continue;
            }
            if(timeGrid[i].dayOfWeek===5)
            {
              difference=timeGrid[i].totalTime-hoursLimit.saturday;
            }
            else
            {
              difference=timeGrid[i].totalTime-hoursLimit.weekday;
            }
            if(difference<0)
            {
              dataSign='-';
            }
            else
            {
              dataSign='+';
            }
            td.setAttribute('data-sign',dataSign);
            if(difference===0)
            {
              dataSign='';
            }
            else
            {
              dataSign=dataSign+' ';
            }
            td.innerHTML=dataSign+millisecondsToHourMinute(difference);
            ++i;
          }

        },

      tableTitle=$1('table > tbody > tr:nth-of-type(1) > th:nth-of-type(1)');

    let

      totalColumns=parseInt(tableTitle.getAttribute('colspan'),10),

// GRID OF HOURS WORKED BY DAY OF THE MONTH AND CORRESPONDING DAY OF THE WEEK
      timeGrid=[],

// TIME LIMIT OF HOURS WORKED FOR WEEKDAYS AND SATURDAYS
      hoursLimit=
        {
          weekday: new Date('1970-01-01T05:20:00+0000'),
          saturday: new Date('1970-01-01T03:00:00+0000')
        };

// INHIBIT MORE THAN ONE EXECUTION

    if($1('body').hasAttribute('improved'))
    {
      return;
    }

// RUN, CODE, RUN!

    addNewStyles();

    populateTimeArray();

    addVisualControlToAdjustLimits();

    adjustStructureTable();

    setDataToSumColumn();

    setAttrToSumColumn();

    setDataAndAttrToDiffColumn();

    $1('body').setAttribute('improved','yep');

  }

)()