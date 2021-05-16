
(function(){
    var L2D_DELETE_INVISIBLE_LAYER = false ;
    var L2D_MERGE_SKIP_PREFIX = "*" ;
    var L2D_VERBOSE = false ;

 
    var doc = app.activeDocument ;

    doc.suspendHistory("Live2Dゴミ取り", "mymain()");


    //===================================================
    //      Delete Small Area of All Layers
    //  delete small area , by apply blur and cut by threshold 
    // param cutLevel  0..255 ,  0 : smallest , 5 : safety , 25 : delete bigger area , 
    // param blurSize 4 is default 
    // param isQuickMask_Mask    user setting of QuickMaskOptions ( mask : true / selection : false )
    //===================================================
    function deleteSmallAreaOfAllLayers( layers , prefix , cutLevel , blurSize ,  isQuickMask_Mask ){
        for( var i = layers.length-1 ; i >= 0  ; i-- ){
            var cur = layers[i] ;
            try{
                if( ! cur.visible ) continue ;
                doc.activeLayer = cur ;
                
                if( L2D_VERBOSE ) $.writeln( "cur : " + cur ) ;
                
                if( cur.layers ){
                    deleteSmallAreaOfAllLayers( cur.layers , prefix , cutLevel , blurSize ,  isQuickMask_Mask  ) ;
                }
                else{
                    // Delete Small Area!!
                    deleteSmallArea( cutLevel , blurSize , isQuickMask_Mask ) ;
                }

            }catch(e){
                if( L2D_VERBOSE ) $.writeln( "error at scan layers : " + cur.name + " \n " + e ) ;
            }
        }
    }

    //===================================================
    //      Delete Small Area
    //  delete small area , by apply blur and cut by threshold 
    // param cutLevel  0..255 ,  0 : smallest , 5 : safety , 25 : delete bigger area , 
    // param blurSize 4 is default 
     // param isQuickMask_Mask    user setting of QuickMaskOptions ( mask : true / selection : false )
   //===================================================
    function deleteSmallArea( cutLevel  , blurSize , isQuickMask_Mask ){
        loadTransparencyAll() ;
        doc.quickMaskMode = true ;
        doc.activeLayer.applyGaussianBlur(blurSize) ;
        
        if( isQuickMask_Mask ){
            doc.activeLayer.invert() ;//invert masking color
         }
        doc.activeLayer.threshold (255 - cutLevel) ;//cut small area
        
        doc.quickMaskMode = false  ;
        if( ! isQuickMask_Mask ){
            doc.selection.invert() ;
        }
        doc.selection.clear() ;
        doc.selection.deselect() ;
    }

    //===================================================
    //      select Layer Transparency 
    //===================================================
    // https://forums.adobe.com/thread/290201?start=0&tstart=0
    function loadTransparencyAll() {
       var desc13 = new ActionDescriptor();
            var ref10 = new ActionReference();
            ref10.putProperty( charIDToTypeID('Chnl'), charIDToTypeID('fsel') );
            desc13.putReference( charIDToTypeID('null'), ref10 );
            var ref11 = new ActionReference();
            ref11.putEnumerated( charIDToTypeID('Chnl'), charIDToTypeID('Chnl'), charIDToTypeID('Trsp') );
            
            ref11.putName( charIDToTypeID('Lyr '), doc.activeLayer.name );
//            ref11.putName( charIDToTypeID('Lyr '), activeDocument.artLayers[0].name );
 
            
        desc13.putReference( charIDToTypeID('T   '), ref11 );
        try{
            executeAction( charIDToTypeID('setd'), desc13, DialogModes.NO );
        }catch(e){
            if( L2D_VERBOSE ) $.writeln( "error at loadTransparencyAll : " + cur.name + " / " + e ) ;           
        }
    };

    //===================================================
    // ユーザ入力を受付
    // threshold値を返す
    function inputThreshold(){
        var x=20 ; 
        var y=20; 
        var line = 20 ;
        var feed = 25 ;
        var dlg=new Window("dialog", "ゴミ取り設定", [100,100,480,300]);;    

        dlg.add("statictext" , [x, y,  400, y+ line],"しきい値を入力して下さい(0..255)");
        //y += line ;
        dlg.titleEt = dlg.add("edittext", [x + 200 , y-2, x + 200+50 , y + 16],"5");
        y = 50 ;
        feed = 20 ;
        x = 50 ;
        dlg.add("statictext" , [x, y,  400, y + line], "  5 : 極小領域の破棄" ) ;
        y += feed ;
        dlg.add("statictext" , [x, y,  400, y + line], " 10 : 小さな領域の破棄" ) ;
        y += feed ;
        dlg.add("statictext" , [x, y,  400, y + line], " 25 : 大きな領域の破棄" ) ;

        x = 70 ;
        dlg.btnOK      = dlg.add("button" , [x+28, 158, x+112, 182] , '実行') ;
        dlg.btnCancel = dlg.add("button" , [x+128, 158,x+ 212, 182] , 'キャンセル') ;

        dlg.btnOK.onClick      = function(){ this.parent.close( true ); };
        dlg.btnCancel.onClick = function(){ this.parent.close( false ); };

        dlg.center();

        var result = dlg.show();
        var cutLevel = parseInt( dlg.titleEt.text )
        return cutLevel ;
    }

	//===================================================
	//	Check if quickMaskMode user setting is masked area.
	//	masked area returns true
	//	selected area returns false 
	//===================================================
    // SolidColorオブジェクトを返す
    function mycolor( rr , gg , bb ){
        var colObj = new SolidColor( );
        colObj.rgb.red = rr;
        colObj.rgb.green = gg;
        colObj.rgb.blue = bb;
        return colObj ;
    }


    // クイックマスクのオプション設定が、
    // 「マスク範囲に色を付ける」の場合は true を返す
    // 「選択範囲に色を付ける」の場合は false を返す
    function isQuickMaskOption_Mask(){

        doc.selection.deselect() ;// 通常モードで、選択範囲を解除する
        doc.quickMaskMode = true ;// クイックマスクモードにする

        // x 0..1 を 255で、1..wを0 で塗りつぶす
        var w = doc.width.value ;
        var h = doc.height.value ;
        doc.selection.select( [[0,0] , [1,0], [1,h] , [0,h]]  ) ;
        doc.selection.fill( mycolor( 255, 255, 255 ) ,ColorBlendMode.NORMAL, 100 , false);    
        doc.selection.select( [[1,0] , [w,0], [w,h] , [1,h]]  ) ;
        doc.selection.fill( mycolor( 0, 0, 0 ) ,ColorBlendMode.NORMAL, 100 , false);    // 特定の範囲を、指定色（255,255,255)で塗りつぶす

        doc.quickMaskMode = false ;// クイックマスクを解除する
        var result = doc.selection.bounds[0].value == 0 ;
        doc.selection.deselect() ;// 通常モードで、選択範囲を解除する
        return result ;
    }

    //===================================================
    //          Main 
    //===================================================
    function mymain(){
        if( L2D_VERBOSE ) $.writeln( "-------------------------" ) ;

        var isQuickMask_Mask = isQuickMaskOption_Mask()  ;
        if( L2D_VERBOSE ) $.writeln( "isQuickMask_Mask : " + isQuickMask_Mask ) ;
        var cutLevel = inputThreshold() ;

        // ドキュメント外の画像を破棄する
        var bounds = [0,0 ,doc.width ,doc.height] ;
        doc.crop(bounds) ;

        // 微小領域を削除する
        var layers = doc.layers ;
        deleteSmallAreaOfAllLayers( layers , "" ,cutLevel , 4 , isQuickMask_Mask) ;
    }

})() ;

