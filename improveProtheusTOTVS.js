(

  ()=>
  {

    'use strict';

    const

      // 5 HORAS E 20 MINUTOS = (new Date('1970-01-01T05:20:00+0000')).getTime()
      limitToLazyDay=new Date('1970-01-01T02:20:00+0000'),

      targetFrame=
        document.
        getElementById('mybcontainer_iframe').
        contentDocument.
        getElementById('principal').
        contentDocument,

      tableTitle=
        targetFrame.
        querySelector('table > tbody > tr:nth-of-type(1) > th:nth-of-type(1)'),

      totalColumns=parseInt(tableTitle.getAttribute('colspan'),10),

      timeColumnPairs=(totalColumns-5)/2,

      newCellPosition=totalColumns-4,

      addNewStyles=
        ()=>
        {
          const
            newStyles=
              targetFrame.head.appendChild(document.createElement('style'));
          newStyles.innerHTML=
            'table tbody tr:hover{background:#ebebeb}'+
            'table tbody tr:nth-child(2n+1):hover{background:#e5e5e5}'+
            '.lazy-day{color:#f00}';
        },

      resizeTableTitle=
        ()=>
        {
          tableTitle.setAttribute('colspan',totalColumns+1);
        },

      addSumColumnToTable=
        ()=>
        {

          const
            textToTime=
              text=>
              {
                return new Date('1970-01-01 '+text.replace(/\D+/g,'').replace(/(\d{2})(\d{2})$/,'$1:$2')+':00');
              },
            timeToText=
              milliseconds=>
              {
                let
                  seconds=Math.floor(milliseconds/1000),
                  minutes=Math.floor(seconds/60),
                  hours=Math.floor(minutes/60);
                minutes=minutes%60;
                return `${hours.toString().padStart(2,'0')}:${minutes.toString().padStart(2,'0')}`;
              };

          let
            totalTime,
            html;

          for(let tr of targetFrame.querySelectorAll('table > tbody > tr'))
          {
            switch(tr.rowIndex)
            {
              case 0:
                continue;
              case 1:
                tr.children[newCellPosition].insertAdjacentHTML('afterend','<th width="30">Total</th>');
                continue;
              default:
                totalTime=0;
                for(let i=0;i<timeColumnPairs;++i)
                {
                  if(tr.children[(2*i)+2].textContent.trim()==='')
                  {
                    continue;
                  }
                  totalTime+=textToTime(tr.children[(2*i)+3].textContent)-textToTime(tr.children[(2*i)+2].textContent);
                }
                switch(true)
                {
                  case (totalTime===0):
                    html='<td class="info-cent">&nbsp;</td>';
                    break;
                  case (totalTime>0 && totalTime<limitToLazyDay):
                    html='<td class="info-cent lazy-day">'+timeToText(totalTime)+'</td>';
                    break;
                  default:
                    html='<td class="info-cent">'+timeToText(totalTime)+'</td>';
                    break;
                }
                tr.children[newCellPosition].insertAdjacentHTML('afterend',html);
                break;
            }
          }

        },

      addButtonToExport=
        ()=>
        {
          targetFrame.
            querySelector('#divSolicitacao > input[type="button"]:last-of-type').
            insertAdjacentHTML('afterend','<input class="botoes" type="button" value="Exportar XLS" name="Exportar_XLS">');
          targetFrame.
            querySelector('#divSolicitacao > input[type="button"]:last-of-type').
            addEventListener(
              'click',
              exportToExcel
            );
        },

      exportToExcel=
        ()=>
        {
          const

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
                  date=date.join('-')
                }
                return date;
              },

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

            xml=
              (

                ()=>
                {

                  const

                    template=
                      '<?xml version="1.0" encoding="UTF-8"?>'+
                      '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" xmlns:html="http://www.w3.org/TR/REC-html40">'+
                        '<Styles>'+
                          '<Style ss:ID="dptbr_bold"><NumberFormat ss:Format="DD/MM/YYYY"/><Font ss:Bold="1"/></Style>'+
                          '<Style ss:ID="tptbr_bold"><NumberFormat ss:Format="HH:MM"/><Font ss:Bold="1"/></Style>'+
                          '<Style ss:ID="sptbr_bold"><NumberFormat ss:Format="@"/><Font ss:Bold="1"/></Style>'+
                          '<Style ss:ID="dptbr"><NumberFormat ss:Format="DD/MM/YYYY"/></Style>'+
                          '<Style ss:ID="tptbr"><NumberFormat ss:Format="HH:MM"/></Style>'+
                          '<Style ss:ID="sptbr"><NumberFormat ss:Format="@"/></Style>'+
                        '</Styles>'+
                        '<Worksheet ss:Name="{{WORKSHEETNAME}}">'+
                          '<Table>'+
                            '{{ROWS}}'+
                          '</Table>'+
                          '<ConditionalFormatting xmlns="urn:schemas-microsoft-com:office:excel">'+
                            '<Range>G2:G29</Range>'+
                            '<Condition>'+
                              '<Qualifier>Less</Qualifier>'+
                              '<Value1>05:20:00</Value1>'+
                              '<Format Style="color:red"/>'+
                            '</Condition>'+
                          '</ConditionalFormatting>'+
                        '</Worksheet>'+
                      '</Workbook>',

                    setWorksheetName=
                      name=>
                      {
                        worksheetName=name;
                      },

                    newRow=
                      ()=>
                      {
                        if(rowOpen)
                        {
                          tableContent.push('</Row>');
                        }
                        rowOpen=true;
                        tableContent.push('<Row>');
                      },

                    writeData=
                      params=>
                      {
                        let
                          cell='<Cell';
                        if(
                          params.horizontalMerge &&
                          parseInt(params.horizontalMerge,10)>0
                        )
                        {
                          cell+=` ss:MergeAcross="${parseInt(params.horizontalMerge,10)}"`;
                        }
                        cell+=' ss:StyleID="';

                        if(
                          params.dataType &&
                          typeof params.dataType==='string' &&
                          params.dataType.length===1
                        )
                        {
                          params.dataType=params.dataType.toLocaleLowerCase();
                        }
                        else
                        {
                          params.dataType='s';
                        }

                        if(params.content)
                        {
                          if(typeof params.content!=='string')
                          {
                            params.content=params.content.toString();
                          }
                        }
                        else
                        {
                          params.content='';
                        }

                        switch(params.dataType)
                        {
                          case 'd':
                            cell+='d';
                            params.content=`${params.content}T00:00:00`;
                            break;
                          case 's':
                            cell+='s';
                            break;
                          case 't':
                            cell+='t';
                            break;
                        }

                        cell+='ptbr';

                        if(
                          params.format &&
                          params.format.bold &&
                          typeof params.format.bold==='boolean' &&
                          params.format.bold
                        )
                        {
                          cell+='_bold';
                        }
                        cell+='"';

                        if(params.formula)
                        {
                          if(typeof params.formula!=='string')
                          {
                            params.formula=params.formula.toString();
                          }
                        }
                        else
                        {
                          params.formula='';
                        }
                        if(params.formula!=='')
                        {
                          cell+=` ss:Formula="${params.formula}"`;
                        }

                        cell+='><Data ss:Type="';
                        switch(params.dataType)
                        {
                          case 'd':
                          case 't':
                            cell+='DateTime';
                            break;
                          case 's':
                            cell+='String';
                            break;
                        }

                        cell+=`">${params.content}</Data></Cell>`;

                        tableContent.push(cell);
                      },

                    forceDownload=
                      (root,filename)=>
                      {
                        if(rowOpen)
                        {
                          tableContent.push('</Row>');
                        }
                        const
                          anchor=root.appendChild(document.createElement('a')),
                          encodedSource=
                            window.btoa(
                              unescape( // DEPRECATED
                                encodeURIComponent(
                                  template.replace(
                                    '{{WORKSHEETNAME}}',
                                    worksheetName
                                  ).replace(
                                    '{{ROWS}}',
                                    tableContent.join('')
                                  )
                                )
                              )
                            );
                        anchor.setAttribute(
                          'href',
                          'data:application/vnd.ms-excel;charset=utf-8;base64,'+encodedSource
                        );
                        anchor.setAttribute('download',filename);
                        anchor.click();
                        anchor.remove();
                      };

                  let
                    tableContent=[],
                    worksheetName='Aba 1',
                    rowOpen=false;

                  return {
                    setWorksheetName,
                    newRow,
                    writeData,
                    forceDownload
                  }

                }

              )();

          let
            tmp,
            tmpDate,
            column,
            formula=[];

          xml.setWorksheetName('MARCAÇÕES');
          xml.newRow();
          xml.writeData(
            {
              content: tableTitle.textContent.trim(),
              format:
                {
                  bold: true
                },
              horizontalMerge: totalColumns
            }
          );
          xml.newRow();
          xml.writeData(
            {
              content: 'DATA',
              format:
                {
                  bold: true
                }
            }
          );
          xml.writeData(
            {
              content: 'DIA',
              format:
                {
                  bold: true
                }
            }
          );
          for(let i=1,t=(totalColumns-5)/2;i<=t;++i)
          {
            xml.writeData(
              {
                content: `${i}a E.`,
                format:
                  {
                    bold: true
                  }
              }
            );
            xml.writeData(
              {
                content: `${i}a S.`,
                format:
                  {
                    bold: true
                  }
              }
            );
          }
          xml.writeData(
            {
              content: 'TOTAL',
              format:
                {
                  bold: true
                }
            }
          );
          xml.writeData(
            {
              content: 'OBSERVAÇÕES',
              format:
                {
                  bold: true
                }
            }
          );
          xml.writeData(
            {
              content: 'MOT. ABONO',
              format:
                {
                  bold: true
                }
            }
          );
          xml.writeData(
            {
              content: 'TIPO MARCAÇÃO',
              format:
                {
                  bold: true
                }
            }
          );
          for(let i=(totalColumns-5)/2;i>0;--i)
          {
            formula.push('(RC[-'+((i*2)-1)+']-RC[-'+(i*2)+'])');
          }
          formula='='+formula.join('+');
          for(let tr of targetFrame.querySelectorAll('table > tbody > tr'))
          {
            if(tr.rowIndex<2)
            {
              continue;
            }
            xml.newRow();
            tmpDate=normalizeDate(tr.children[0].textContent);
            xml.writeData(
              {
                content: tmpDate,
                dataType: 'd'
              }
            );
            xml.writeData(
              {
                content: tr.children[1].textContent.trim().toUpperCase()
              }
            );
            for(let i=2,t=totalColumns-3;i<t;++i)
            {
              tmp=normalizeTime(tr.children[i].textContent);
              xml.writeData(
                {
                  content: `${tmpDate}T${tmp}`,
                  dataType: 't'
                }
              );
            }
            xml.writeData(
              {
                formula: formula,
                dataType: 't'
              }
            );
            column=totalColumns-2;
            xml.writeData(
              {
                content: tr.children[column].textContent.replaceAll('*','').trim().toUpperCase()
              }
            );
            xml.writeData(
              {
                content: tr.children[++column].textContent.trim().toUpperCase()
              }
            );
            tmp=normalizeTime(tr.children[++column].textContent);
            xml.writeData(
              {
                content: `${tmpDate}T${tmp}`,
                dataType: 't'
              }
            );
          }
          xml.forceDownload(
            targetFrame.getElementById('divSolicitacao'),
            targetFrame.
              querySelector('#divCabecalho > fieldset > .container-cabec:nth-of-type(2) > .div-conteudo').
              textContent+
              ' - '+
              targetFrame.
              querySelector('table > tbody > tr:nth-of-type(1) > th:nth-of-type(1)').
              textContent+
              '.xls'
          );

        };

    if(targetFrame.querySelector('body').hasAttribute('improved'))
    {
      return;
    }

    addNewStyles();

    resizeTableTitle();

    addSumColumnToTable();

    addButtonToExport();

    targetFrame.querySelector('body').setAttribute('improved','yep');

  }

)()
